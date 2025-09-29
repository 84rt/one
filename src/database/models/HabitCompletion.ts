import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Habit from './Habit';

export default class HabitCompletion extends Model {
  static table = 'habit_completions';

  @field('server_id') serverId!: string | null;
  @field('habit_id') habitId!: string;
  @relation('habits', 'habit_id') habit!: Habit;
  @date('completed_at') completedAt!: Date;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  @date('deleted_at') deletedAt!: Date | null;
  @field('is_synced') isSynced!: boolean;
  @field('sync_status') syncStatus!: string;

  // Computed properties
  get isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  get needsSync(): boolean {
    return !this.isSynced || this.syncStatus === 'error';
  }

  get completedDate(): string {
    return this.completedAt.toISOString().split('T')[0];
  }

  // Helper methods
  markAsSynced(): void {
    this.update(() => {
      this.isSynced = true;
      this.syncStatus = 'synced';
    });
  }

  markAsPendingSync(): void {
    this.update(() => {
      this.isSynced = false;
      this.syncStatus = 'pending';
    });
  }

  markAsSyncError(error: string): void {
    this.update(() => {
      this.isSynced = false;
      this.syncStatus = 'error';
    });
  }

  softDelete(): void {
    this.update(() => {
      this.deletedAt = new Date();
      this.markAsPendingSync();
    });
  }

  restore(): void {
    this.update(() => {
      this.deletedAt = null;
      this.markAsPendingSync();
    });
  }
}
