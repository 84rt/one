import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Habit extends Model {
  static table = 'habits';

  @field('name') name!: string;
  @field('description') description!: string | null;
  @field('color') color!: string;
  @readonly @date('created_at') createdAt!: Date;
}
