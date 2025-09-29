import { database } from '../database';
import { supabase } from '../config/supabase';
import { SyncQueue, SyncOperation } from '../database/models/SyncQueue';
import { Habit } from '../database/models/Habit';
import { HabitCompletion } from '../database/models/HabitCompletion';
import * as Network from 'expo-network';

export interface SyncResult {
  success: boolean;
  syncedRecords: number;
  errors: string[];
}

class SyncService {
  private isOnline: boolean = false;
  private syncInProgress: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeNetworkListener();
  }

  private async initializeNetworkListener(): Promise<void> {
    // Check initial network status
    const networkState = await Network.getNetworkStateAsync();
    this.isOnline = networkState.isConnected && networkState.isInternetReachable;

    // Listen for network changes
    Network.addNetworkStateListener((networkState) => {
      const wasOnline = this.isOnline;
      this.isOnline = networkState.isConnected && networkState.isInternetReachable;

      if (!wasOnline && this.isOnline) {
        // Just came online, trigger sync
        this.sync();
      }
    });

    // Start periodic sync when online
    this.startPeriodicSync();
  }

  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.sync();
      }
    }, 30000); // Sync every 30 seconds when online
  }

  public async sync(): Promise<SyncResult> {
    if (!this.isOnline || this.syncInProgress) {
      return { success: false, syncedRecords: 0, errors: ['Not online or sync in progress'] };
    }

    this.syncInProgress = true;
    const result: SyncResult = { success: true, syncedRecords: 0, errors: [] };

    try {
      // 1. Push local changes to server
      const pushResult = await this.pushLocalChanges();
      result.syncedRecords += pushResult.syncedRecords;
      result.errors.push(...pushResult.errors);

      // 2. Pull server changes to local
      const pullResult = await this.pullServerChanges();
      result.syncedRecords += pullResult.syncedRecords;
      result.errors.push(...pullResult.errors);

      result.success = result.errors.length === 0;
    } catch (error) {
      result.success = false;
      result.errors.push(`Sync failed: ${error}`);
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  private async pushLocalChanges(): Promise<{ syncedRecords: number; errors: string[] }> {
    const result = { syncedRecords: 0, errors: [] };

    try {
      // Get all unsynced records from sync queue
      const syncQueue = await database.collections
        .get<SyncQueue>('sync_queue')
        .query()
        .fetch();

      for (const queueItem of syncQueue) {
        try {
          await this.processSyncQueueItem(queueItem);
          await queueItem.destroyPermanently();
          result.syncedRecords++;
        } catch (error) {
          queueItem.setError(String(error));
          result.errors.push(`Failed to sync ${queueItem.tableName}:${queueItem.recordId}: ${error}`);
        }
      }
    } catch (error) {
      result.errors.push(`Failed to process sync queue: ${error}`);
    }

    return result;
  }

  private async processSyncQueueItem(queueItem: SyncQueue): Promise<void> {
    const { tableName, recordId, operation, data } = queueItem;
    const parsedData = queueItem.parsedData;

    switch (tableName) {
      case 'habits':
        await this.syncHabit(operation, recordId, parsedData);
        break;
      case 'habit_completions':
        await this.syncHabitCompletion(operation, recordId, parsedData);
        break;
      default:
        throw new Error(`Unknown table: ${tableName}`);
    }
  }

  private async syncHabit(operation: SyncOperation, recordId: string, data: any): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    switch (operation) {
      case 'create':
        const { data: newHabit, error: createError } = await supabase
          .from('habits')
          .insert({
            ...data,
            user_id: user.user.id,
          })
          .select()
          .single();

        if (createError) throw createError;

        // Update local record with server ID
        const localHabit = await database.collections.get<Habit>('habits').find(recordId);
        localHabit.update(() => {
          localHabit.serverId = newHabit.id;
          localHabit.markAsSynced();
        });
        break;

      case 'update':
        const { error: updateError } = await supabase
          .from('habits')
          .update(data)
          .eq('id', data.server_id);

        if (updateError) throw updateError;

        // Mark as synced
        const localHabitUpdate = await database.collections.get<Habit>('habits').find(recordId);
        localHabitUpdate.markAsSynced();
        break;

      case 'delete':
        const { error: deleteError } = await supabase
          .from('habits')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', data.server_id);

        if (deleteError) throw deleteError;
        break;
    }
  }

  private async syncHabitCompletion(operation: SyncOperation, recordId: string, data: any): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    switch (operation) {
      case 'create':
        const { data: newCompletion, error: createError } = await supabase
          .from('habit_completions')
          .insert({
            ...data,
            user_id: user.user.id,
          })
          .select()
          .single();

        if (createError) throw createError;

        // Update local record with server ID
        const localCompletion = await database.collections.get<HabitCompletion>('habit_completions').find(recordId);
        localCompletion.update(() => {
          localCompletion.serverId = newCompletion.id;
          localCompletion.markAsSynced();
        });
        break;

      case 'update':
        const { error: updateError } = await supabase
          .from('habit_completions')
          .update(data)
          .eq('id', data.server_id);

        if (updateError) throw updateError;

        // Mark as synced
        const localCompletionUpdate = await database.collections.get<HabitCompletion>('habit_completions').find(recordId);
        localCompletionUpdate.markAsSynced();
        break;

      case 'delete':
        const { error: deleteError } = await supabase
          .from('habit_completions')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', data.server_id);

        if (deleteError) throw deleteError;
        break;
    }
  }

  private async pullServerChanges(): Promise<{ syncedRecords: number; errors: string[] }> {
    const result = { syncedRecords: 0, errors: [] };

    try {
      // Get last sync timestamp
      const lastSync = await this.getLastSyncTimestamp();

      // Pull habits
      const habitsResult = await this.pullHabits(lastSync);
      result.syncedRecords += habitsResult.syncedRecords;
      result.errors.push(...habitsResult.errors);

      // Pull habit completions
      const completionsResult = await this.pullHabitCompletions(lastSync);
      result.syncedRecords += completionsResult.syncedRecords;
      result.errors.push(...completionsResult.errors);

      // Update last sync timestamp
      await this.setLastSyncTimestamp(new Date());
    } catch (error) {
      result.errors.push(`Failed to pull server changes: ${error}`);
    }

    return result;
  }

  private async pullHabits(lastSync: Date): Promise<{ syncedRecords: number; errors: string[] }> {
    const result = { syncedRecords: 0, errors: [] };

    try {
      const { data: habits, error } = await supabase
        .from('habits')
        .select('*')
        .gte('updated_at', lastSync.toISOString())
        .is('deleted_at', null);

      if (error) throw error;

      for (const habit of habits || []) {
        try {
          await this.upsertHabit(habit);
          result.syncedRecords++;
        } catch (error) {
          result.errors.push(`Failed to sync habit ${habit.id}: ${error}`);
        }
      }
    } catch (error) {
      result.errors.push(`Failed to pull habits: ${error}`);
    }

    return result;
  }

  private async pullHabitCompletions(lastSync: Date): Promise<{ syncedRecords: number; errors: string[] }> {
    const result = { syncedRecords: 0, errors: [] };

    try {
      const { data: completions, error } = await supabase
        .from('habit_completions')
        .select('*')
        .gte('updated_at', lastSync.toISOString())
        .is('deleted_at', null);

      if (error) throw error;

      for (const completion of completions || []) {
        try {
          await this.upsertHabitCompletion(completion);
          result.syncedRecords++;
        } catch (error) {
          result.errors.push(`Failed to sync completion ${completion.id}: ${error}`);
        }
      }
    } catch (error) {
      result.errors.push(`Failed to pull habit completions: ${error}`);
    }

    return result;
  }

  private async upsertHabit(serverHabit: any): Promise<void> {
    const existingHabit = await database.collections
      .get<Habit>('habits')
      .query()
      .where('server_id', serverHabit.id)
      .fetch();

    if (existingHabit.length > 0) {
      // Update existing
      const habit = existingHabit[0];
      habit.update(() => {
        habit.name = serverHabit.name;
        habit.description = serverHabit.description;
        habit.color = serverHabit.color;
        habit.icon = serverHabit.icon;
        habit.targetFrequency = serverHabit.target_frequency;
        habit.markAsSynced();
      });
    } else {
      // Create new
      await database.write(async () => {
        await database.collections.get<Habit>('habits').create((habit) => {
          habit.serverId = serverHabit.id;
          habit.name = serverHabit.name;
          habit.description = serverHabit.description;
          habit.color = serverHabit.color;
          habit.icon = serverHabit.icon;
          habit.targetFrequency = serverHabit.target_frequency;
          habit.createdAt = new Date(serverHabit.created_at);
          habit.updatedAt = new Date(serverHabit.updated_at);
          habit.markAsSynced();
        });
      });
    }
  }

  private async upsertHabitCompletion(serverCompletion: any): Promise<void> {
    const existingCompletion = await database.collections
      .get<HabitCompletion>('habit_completions')
      .query()
      .where('server_id', serverCompletion.id)
      .fetch();

    if (existingCompletion.length > 0) {
      // Update existing
      const completion = existingCompletion[0];
      completion.update(() => {
        completion.habitId = serverCompletion.habit_id;
        completion.completedAt = new Date(serverCompletion.completed_at);
        completion.markAsSynced();
      });
    } else {
      // Create new
      await database.write(async () => {
        await database.collections.get<HabitCompletion>('habit_completions').create((completion) => {
          completion.serverId = serverCompletion.id;
          completion.habitId = serverCompletion.habit_id;
          completion.completedAt = new Date(serverCompletion.completed_at);
          completion.createdAt = new Date(serverCompletion.created_at);
          completion.updatedAt = new Date(serverCompletion.updated_at);
          completion.markAsSynced();
        });
      });
    }
  }

  private async getLastSyncTimestamp(): Promise<Date> {
    // In a real app, you'd store this in AsyncStorage or a settings table
    // For now, return a date from 24 hours ago
    return new Date(Date.now() - 24 * 60 * 60 * 1000);
  }

  private async setLastSyncTimestamp(timestamp: Date): Promise<void> {
    // In a real app, you'd store this in AsyncStorage or a settings table
    console.log('Last sync timestamp:', timestamp);
  }

  public async addToSyncQueue(
    tableName: string,
    recordId: string,
    operation: SyncOperation,
    data: any
  ): Promise<void> {
    await database.write(async () => {
      await database.collections.get<SyncQueue>('sync_queue').create((queueItem) => {
        queueItem.tableName = tableName;
        queueItem.recordId = recordId;
        queueItem.operation = operation;
        queueItem.setData(data);
        queueItem.retryCount = 0;
      });
    });
  }

  public get isOnlineStatus(): boolean {
    return this.isOnline;
  }

  public get isSyncInProgress(): boolean {
    return this.syncInProgress;
  }
}

export const syncService = new SyncService();
