import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Habit extends Model {
  static table = 'habits';

  @field('server_id') serverId!: string | null;
  @field('name') name!: string;
  @field('description') description!: string | null;
  @field('color') color!: string;
  @field('icon') icon!: string;
  @field('target_frequency') targetFrequency!: number;
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
