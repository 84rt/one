import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export type SyncOperation = 'create' | 'update' | 'delete';

export default class SyncQueue extends Model {
  static table = 'sync_queue';

  @field('table_name') tableName!: string;
  @field('record_id') recordId!: string;
  @field('operation') operation!: SyncOperation;
  @field('data') data!: string; // JSON string
  @readonly @date('created_at') createdAt!: Date;
  @field('retry_count') retryCount!: number;
  @field('last_error') lastError!: string | null;

  // Helper methods
  incrementRetryCount(): void {
    this.update(() => {
      this.retryCount += 1;
    });
  }

  setError(error: string): void {
    this.update(() => {
      this.lastError = error;
      this.incrementRetryCount();
    });
  }

  clearError(): void {
    this.update(() => {
      this.lastError = null;
    });
  }

  get parsedData(): any {
    try {
      return JSON.parse(this.data);
    } catch (error) {
      console.error('Failed to parse sync queue data:', error);
      return null;
    }
  }

  setData(data: any): void {
    this.update(() => {
      this.data = JSON.stringify(data);
    });
  }
}
