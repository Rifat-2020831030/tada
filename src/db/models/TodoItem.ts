import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text, relation } from '@nozbe/watermelondb/decorators';
import { Document } from './Document';

export class TodoItem extends Model {
  static table = 'todo_items';
  static associations = {
    documents: { type: 'belongs_to' as const, key: 'document_id' },
  };

  @text('document_id') documentId!: string;
  @text('parent_id') parentId!: string | null;
  @text('text') text!: string;
  @field('is_completed') isCompleted!: boolean;
  @date('completed_at') completedAt!: Date | null;
  @text('position') position!: string;
  @text('previous_position') previousPosition!: string | null;
  @readonly @date('created_at') createdAt!: Date;

  @relation('documents', 'document_id') document!: any;
}
