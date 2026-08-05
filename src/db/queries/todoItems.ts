import { Q } from '@nozbe/watermelondb';
import { database } from '../index';
import { TodoItem } from '../models/TodoItem';
import { initialPosition, positionAfter, positionBetween } from '../../utils/fractionalIndex';

export async function createTodoItem(
  documentId: string,
  parentId: string | null = null,
  afterPosition?: string | null,
  text: string = ''
): Promise<TodoItem> {
  return await database.write(async () => {
    const collection = database.get<TodoItem>('todo_items');

    const queryConditions = [
      Q.where('document_id', documentId),
      Q.where('parent_id', parentId ? Q.eq(parentId) : Q.eq(null)),
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
      item.parentId = parentId;
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

export async function toggleTodoComplete(targetItem: TodoItem): Promise<void> {
  await database.write(async () => {
    const collection = database.get<TodoItem>('todo_items');
    const item = await collection.find(targetItem.id).catch(() => targetItem);
    if (!item) return;

    if (!item.isCompleted) {
      // Completing item
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

      const updates: any[] = [];
      const originalPos = item.position;

      updates.push(
        item.prepareUpdate((t) => {
          t.previousPosition = originalPos;
          t.position = newCompletedPos;
          t.isCompleted = true;
          t.completedAt = now;
        })
      );

      // If it's a root todo, cascade complete to all sub-todos
      if (!item.parentId) {
        const subTodos = await collection
          .query(
            Q.where('document_id', item.documentId),
            Q.where('parent_id', item.id),
            Q.where('is_completed', false)
          )
          .fetch();

        for (const sub of subTodos) {
          const subOriginalPos = sub.position;
          updates.push(
            sub.prepareUpdate((s) => {
              s.previousPosition = subOriginalPos;
              s.isCompleted = true;
              s.completedAt = now;
            })
          );
        }
      }

      await database.batch(...updates);
    } else {
      // Un-completing item
      const updates: any[] = [];
      const restoredPos = item.previousPosition || initialPosition();

      updates.push(
        item.prepareUpdate((t) => {
          t.position = restoredPos;
          t.previousPosition = null;
          t.isCompleted = false;
          t.completedAt = null;
        })
      );

      // If this is a sub-todo, also un-complete its parent if completed
      if (item.parentId) {
        const parent = await collection.find(item.parentId).catch(() => null);
        if (parent && parent.isCompleted) {
          const parentRestoredPos = parent.previousPosition || initialPosition();
          updates.push(
            parent.prepareUpdate((p) => {
              p.position = parentRestoredPos;
              p.previousPosition = null;
              p.isCompleted = false;
              p.completedAt = null;
            })
          );
        }
      } else {
        // If un-completing a root todo, un-complete all sub-todos
        const completedSubTodos = await collection
          .query(
            Q.where('document_id', item.documentId),
            Q.where('parent_id', item.id),
            Q.where('is_completed', true)
          )
          .fetch();

        for (const sub of completedSubTodos) {
          const subRestoredPos = sub.previousPosition || initialPosition();
          updates.push(
            sub.prepareUpdate((s) => {
              s.position = subRestoredPos;
              s.previousPosition = null;
              s.isCompleted = false;
              s.completedAt = null;
            })
          );
        }
      }

      await database.batch(...updates);
    }
  });
}

export async function completeAllTodoItems(documentId: string): Promise<void> {
  await database.write(async () => {
    const collection = database.get<TodoItem>('todo_items');
    const items = await collection.query(Q.where('document_id', documentId)).fetch();
    const uncompleted = items.filter((i) => !i.isCompleted);

    const now = new Date();
    const updates: any[] = [];

    if (uncompleted.length > 0) {
      for (const item of uncompleted) {
        updates.push(
          item.prepareUpdate((t) => {
            t.previousPosition = t.position;
            t.isCompleted = true;
            t.completedAt = now;
          })
        );
      }
    } else {
      for (const item of items) {
        const restoredPos = item.previousPosition || item.position;
        updates.push(
          item.prepareUpdate((t) => {
            t.position = restoredPos;
            t.previousPosition = null;
            t.isCompleted = false;
            t.completedAt = null;
          })
        );
      }
    }

    if (updates.length > 0) {
      await database.batch(...updates);
    }
  });
}

export async function deleteTodoItem(item: TodoItem): Promise<void> {
  await database.write(async () => {
    const collection = database.get<TodoItem>('todo_items');
    const updates: any[] = [item.prepareDestroyPermanently()];

    if (!item.parentId) {
      const subTodos = await collection
        .query(Q.where('document_id', item.documentId), Q.where('parent_id', item.id))
        .fetch();

      for (const sub of subTodos) {
        updates.push(sub.prepareDestroyPermanently());
      }
    }

    await database.batch(...updates);
  });
}

export async function indentTodoItem(item: TodoItem, potentialParentId: string): Promise<boolean> {
  if (item.parentId) return false;

  return await database.write(async () => {
    const collection = database.get<TodoItem>('todo_items');
    const subTodosOfPotentialParent = await collection
      .query(
        Q.where('document_id', item.documentId),
        Q.where('parent_id', potentialParentId),
        Q.sortBy('position', Q.asc)
      )
      .fetch();

    const lastSub = subTodosOfPotentialParent.length > 0 ? subTodosOfPotentialParent[subTodosOfPotentialParent.length - 1] : null;
    const newPos = positionAfter(lastSub ? lastSub.position : null);

    await item.update((t) => {
      t.parentId = potentialParentId;
      t.position = newPos;
    });

    return true;
  });
}

export async function outdentTodoItem(item: TodoItem, parentItem: TodoItem): Promise<boolean> {
  if (!item.parentId) return false;

  return await database.write(async () => {
    const collection = database.get<TodoItem>('todo_items');
    const rootItems = await collection
      .query(
        Q.where('document_id', item.documentId),
        Q.where('parent_id', Q.eq(null)),
        Q.sortBy('position', Q.asc)
      )
      .fetch();

    const parentIdx = rootItems.findIndex((r) => r.id === parentItem.id);
    const nextRoot = parentIdx >= 0 && parentIdx < rootItems.length - 1 ? rootItems[parentIdx + 1] : null;
    const newPos = positionBetween(parentItem.position, nextRoot ? nextRoot.position : null);

    await item.update((t) => {
      t.parentId = null;
      t.position = newPos;
    });

    return true;
  });
}

export async function updateTodoPosition(item: TodoItem, newPosition: string): Promise<void> {
  await database.write(async () => {
    await item.update((t) => {
      t.position = newPosition;
    });
  });
}
