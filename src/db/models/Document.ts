import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text, children } from '@nozbe/watermelondb/decorators';
import { TodoItem } from './TodoItem';

export class Document extends Model {
  static table = 'documents';
  static associations = {
    todo_items: { type: 'has_many' as const, foreignKey: 'document_id' },
  };

  @text('type') type!: string;
  @text('title') title!: string;
  @text('color') color!: string;
  @field('is_pinned') isPinned!: boolean;
  @field('is_archived') isArchived!: boolean;
  @text('position') position!: string;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @children('todo_items') todoItems!: any;
}
