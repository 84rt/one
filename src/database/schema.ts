import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'habits',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'color', type: 'string' },
        { name: 'icon', type: 'string' },
        { name: 'target_frequency', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'deleted_at', type: 'number', isOptional: true },
        { name: 'is_synced', type: 'boolean' },
        { name: 'sync_status', type: 'string' }, // 'pending', 'synced', 'error'
      ],
    }),
    tableSchema({
      name: 'habit_completions',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'habit_id', type: 'string', isIndexed: true },
        { name: 'completed_at', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'deleted_at', type: 'number', isOptional: true },
        { name: 'is_synced', type: 'boolean' },
        { name: 'sync_status', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'habit_groups',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'created_by', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'deleted_at', type: 'number', isOptional: true },
        { name: 'is_synced', type: 'boolean' },
        { name: 'sync_status', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'group_members',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'group_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'role', type: 'string' },
        { name: 'joined_at', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'deleted_at', type: 'number', isOptional: true },
        { name: 'is_synced', type: 'boolean' },
        { name: 'sync_status', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'group_habits',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'group_id', type: 'string', isIndexed: true },
        { name: 'habit_id', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'deleted_at', type: 'number', isOptional: true },
        { name: 'is_synced', type: 'boolean' },
        { name: 'sync_status', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'sync_queue',
      columns: [
        { name: 'table_name', type: 'string' },
        { name: 'record_id', type: 'string' },
        { name: 'operation', type: 'string' }, // 'create', 'update', 'delete'
        { name: 'data', type: 'string' }, // JSON string
        { name: 'created_at', type: 'number' },
        { name: 'retry_count', type: 'number' },
        { name: 'last_error', type: 'string', isOptional: true },
      ],
    }),
  ],
});
