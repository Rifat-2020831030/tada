import { Q } from '@nozbe/watermelondb';
import { database } from '../index';
import { TodoItem } from '../models/TodoItem';
import { initialPosition, positionAfter, positionBetween } from '../../utils/fractionalIndex';

export async function createTodoItem(
  documentId: string,
  afterPosition?: string | null,
  text: string = ''
): Promise<TodoItem> {
  return await database.write(async () => {
    const collection = database.get<TodoItem>('todo_items');

    const queryConditions = [
      Q.where('document_id', documentId),
      Q.sortBy('position', Q.asc),
    ];

    const siblingItems = await collection.query(...queryConditions).fetch();

    let newPosition: string;
    if (afterPosition) {
      const idx = siblingItems.findIndex((item) => item.position === afterPosition);
      const nextItem = idx >= 0 && idx < siblingItems.length - 1 ? siblingItems[idx + 1] : null;
      newPosition = positionBetween(afterPosition, nextItem ? nextItem.position : null);
    } else if (siblingItems.length > 0) {
      const lastItem = siblingItems[siblingItems.length - 1];
      newPosition = positionAfter(lastItem.position);
    } else {
      newPosition = initialPosition();
    }

    return await collection.create((item) => {
      item.documentId = documentId;
      item.text = text;
      item.isCompleted = false;
      item.completedAt = null;
      item.position = newPosition;
      item.previousPosition = null;
    });
  });
}

export async function updateTodoText(item: TodoItem, text: string): Promise<void> {
  await database.write(async () => {
    await item.update((t) => {
      t.text = text;
    });
  });
}

export async function toggleTodoComplete(item: TodoItem): Promise<void> {
  await database.write(async () => {
    const collection = database.get<TodoItem>('todo_items');

    if (!item.isCompleted) {
      const now = new Date();

      const completedItems = await collection
        .query(
          Q.where('document_id', item.documentId),
          Q.where('is_completed', true),
          Q.sortBy('position', Q.asc)
        )
        .fetch();

      const lastCompleted = completedItems.length > 0 ? completedItems[completedItems.length - 1] : null;
      const newCompletedPos = positionAfter(lastCompleted ? lastCompleted.position : null);

      await item.update((t) => {
        t.previousPosition = t.position;
        t.position = newCompletedPos;
        t.isCompleted = true;
        t.completedAt = now;
      });
    } else {
      const restoredPos = item.previousPosition || initialPosition();

      await item.update((t) => {
        t.position = restoredPos;
        t.previousPosition = null;
        t.isCompleted = false;
        t.completedAt = null;
      });
    }
  });
}

export async function deleteTodoItem(item: TodoItem): Promise<void> {
  await database.write(async () => {
    await item.destroyPermanently();
  });
}

export async function updateTodoPosition(item: TodoItem, newPosition: string): Promise<void> {
  await database.write(async () => {
    await item.update((t) => {
      t.position = newPosition;
    });
  });
}
