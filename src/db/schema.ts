import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'documents',
      columns: [
        { name: 'type', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'color', type: 'string' },
        { name: 'is_pinned', type: 'boolean' },
        { name: 'is_archived', type: 'boolean' },
        { name: 'position', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'todo_items',
      columns: [
        { name: 'document_id', type: 'string', isIndexed: true },
        { name: 'parent_id', type: 'string', isOptional: true },
        { name: 'text', type: 'string' },
        { name: 'is_completed', type: 'boolean' },
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'position', type: 'string' },
        { name: 'previous_position', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
