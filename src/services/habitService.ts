import { database } from '../database';
import { Habit } from '../database/models/Habit';
import { HabitCompletion } from '../database/models/HabitCompletion';
import { syncService } from './syncService';
import { authService } from './authService';

export interface CreateHabitData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  targetFrequency?: number;
}

export interface UpdateHabitData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  targetFrequency?: number;
}

export interface HabitWithStreak extends Habit {
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
  completionRate: number;
}

class HabitService {
  public async createHabit(data: CreateHabitData): Promise<Habit> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const habit = await database.write(async () => {
      return await database.collections.get<Habit>('habits').create((habit) => {
        habit.name = data.name;
        habit.description = data.description || null;
        habit.color = data.color || '#3B82F6';
        habit.icon = data.icon || 'check-circle';
        habit.targetFrequency = data.targetFrequency || 7;
        habit.markAsPendingSync();
      });
    });

    // Add to sync queue
    await syncService.addToSyncQueue('habits', habit.id, 'create', {
      name: habit.name,
      description: habit.description,
      color: habit.color,
      icon: habit.icon,
      target_frequency: habit.targetFrequency,
    });

    return habit;
  }

  public async updateHabit(habitId: string, data: UpdateHabitData): Promise<Habit> {
    const habit = await database.collections.get<Habit>('habits').find(habitId);

    await database.write(async () => {
      habit.update(() => {
        if (data.name !== undefined) habit.name = data.name;
        if (data.description !== undefined) habit.description = data.description;
        if (data.color !== undefined) habit.color = data.color;
        if (data.icon !== undefined) habit.icon = data.icon;
        if (data.targetFrequency !== undefined) habit.targetFrequency = data.targetFrequency;
        habit.markAsPendingSync();
      });
    });

    // Add to sync queue
    const syncData: any = {};
    if (data.name !== undefined) syncData.name = data.name;
    if (data.description !== undefined) syncData.description = data.description;
    if (data.color !== undefined) syncData.color = data.color;
    if (data.icon !== undefined) syncData.icon = data.icon;
    if (data.targetFrequency !== undefined) syncData.target_frequency = data.targetFrequency;

    await syncService.addToSyncQueue('habits', habitId, 'update', {
      ...syncData,
      server_id: habit.serverId,
    });

    return habit;
  }

  public async deleteHabit(habitId: string): Promise<void> {
    const habit = await database.collections.get<Habit>('habits').find(habitId);

    await database.write(async () => {
      habit.softDelete();
    });

    // Add to sync queue
    await syncService.addToSyncQueue('habits', habitId, 'delete', {
      server_id: habit.serverId,
    });
  }

  public async getHabits(): Promise<Habit[]> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    return await database.collections
      .get<Habit>('habits')
      .query()
      .where('deleted_at', null)
      .fetch();
  }

  public async getHabit(habitId: string): Promise<Habit> {
    return await database.collections.get<Habit>('habits').find(habitId);
  }

  public async completeHabit(habitId: string, completedAt?: Date): Promise<HabitCompletion> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const completionDate = completedAt || new Date();
    
    // Check if already completed today
    const today = completionDate.toISOString().split('T')[0];
    const existingCompletion = await database.collections
      .get<HabitCompletion>('habit_completions')
      .query()
      .where('habit_id', habitId)
      .where('completed_at', '>=', new Date(today))
      .where('completed_at', '<', new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000))
      .where('deleted_at', null)
      .fetch();

    if (existingCompletion.length > 0) {
      throw new Error('Habit already completed today');
    }

    const completion = await database.write(async () => {
      return await database.collections.get<HabitCompletion>('habit_completions').create((completion) => {
        completion.habitId = habitId;
        completion.completedAt = completionDate;
        completion.markAsPendingSync();
      });
    });

    // Add to sync queue
    await syncService.addToSyncQueue('habit_completions', completion.id, 'create', {
      habit_id: habitId,
      completed_at: completionDate.toISOString(),
    });

    return completion;
  }

  public async uncompleteHabit(habitId: string, date?: Date): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const targetDate = date || new Date();
    const today = targetDate.toISOString().split('T')[0];
    
    const completion = await database.collections
      .get<HabitCompletion>('habit_completions')
      .query()
      .where('habit_id', habitId)
      .where('completed_at', '>=', new Date(today))
      .where('completed_at', '<', new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000))
      .where('deleted_at', null)
      .fetch();

    if (completion.length === 0) {
      throw new Error('No completion found for this date');
    }

    await database.write(async () => {
      completion[0].softDelete();
    });

    // Add to sync queue
    await syncService.addToSyncQueue('habit_completions', completion[0].id, 'delete', {
      server_id: completion[0].serverId,
    });
  }

  public async getHabitCompletions(habitId: string, startDate?: Date, endDate?: Date): Promise<HabitCompletion[]> {
    let query = database.collections
      .get<HabitCompletion>('habit_completions')
      .query()
      .where('habit_id', habitId)
      .where('deleted_at', null);

    if (startDate) {
      query = query.where('completed_at', '>=', startDate);
    }

    if (endDate) {
      query = query.where('completed_at', '<=', endDate);
    }

    return await query.fetch();
  }

  public async isHabitCompletedToday(habitId: string): Promise<boolean> {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const completions = await database.collections
      .get<HabitCompletion>('habit_completions')
      .query()
      .where('habit_id', habitId)
      .where('completed_at', '>=', todayStart)
      .where('completed_at', '<', todayEnd)
      .where('deleted_at', null)
      .fetch();

    return completions.length > 0;
  }

  public async calculateHabitStreak(habitId: string): Promise<number> {
    const completions = await this.getHabitCompletions(habitId);
    
    if (completions.length === 0) {
      return 0;
    }

    // Sort completions by date (newest first)
    const sortedCompletions = completions.sort((a, b) => 
      b.completedAt.getTime() - a.completedAt.getTime()
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const completion of sortedCompletions) {
      const completionDate = new Date(completion.completedAt);
      completionDate.setHours(0, 0, 0, 0);

      if (completionDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (completionDate.getTime() === currentDate.getTime() - 24 * 60 * 60 * 1000) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  public async getHabitsWithStreaks(): Promise<HabitWithStreak[]> {
    const habits = await this.getHabits();
    const habitsWithStreaks: HabitWithStreak[] = [];

    for (const habit of habits) {
      const currentStreak = await this.calculateHabitStreak(habit.id);
      const completedToday = await this.isHabitCompletedToday(habit.id);
      
      // Calculate completion rate for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentCompletions = await this.getHabitCompletions(habit.id, thirtyDaysAgo);
      const completionRate = (recentCompletions.length / 30) * 100;

      habitsWithStreaks.push({
        ...habit,
        currentStreak,
        longestStreak: currentStreak, // TODO: Implement longest streak calculation
        completedToday,
        completionRate,
      });
    }

    return habitsWithStreaks;
  }
}

export const habitService = new HabitService();
