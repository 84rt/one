import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import schema from './schema';
import Habit from './models/Habit';
import HabitCompletion from './models/HabitCompletion';
import SyncQueue from './models/SyncQueue';

// Import other models as they're created
// import HabitGroup from './models/HabitGroup';
// import GroupMember from './models/GroupMember';
// import GroupHabit from './models/GroupHabit';

const adapter = new SQLiteAdapter({
  schema,
  // Uncomment the following line to enable migrations
  // migrations,
  // Uncomment the following line to enable synchronous mode
  // synchronous: true,
  // Uncomment the following line to enable JSI mode
  // jsi: true,
});

export const database = new Database({
  adapter,
  modelClasses: [
    Habit,
    HabitCompletion,
    SyncQueue,
    // Add other models as they're created
  ],
});

export { Habit, HabitCompletion, SyncQueue };
