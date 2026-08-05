import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../db';
import { TodoItem } from '../db/models/TodoItem';

export interface FlattenedTodoRow {
  item: TodoItem;
  isSub: boolean;
  parent: TodoItem | null;
}

export function useTodoItems(documentId: string) {
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!documentId) return;

    const collection = database.get<TodoItem>('todo_items');
    const query = collection.query(
      Q.where('document_id', documentId),
      Q.sortBy('position', Q.asc)
    );

    const subscription = query.observe().subscribe((items) => {
      setTodoItems(items);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [documentId]);

  // Uncompleted items
  const uncompleted = todoItems.filter((i) => !i.isCompleted);
  const uncompletedRoots = uncompleted.filter((i) => !i.parentId);
  const uncompletedFlat: FlattenedTodoRow[] = [];

  for (const root of uncompletedRoots) {
    uncompletedFlat.push({ item: root, isSub: false, parent: null });
    const subs = uncompleted.filter((i) => i.parentId === root.id);
    for (const sub of subs) {
      uncompletedFlat.push({ item: sub, isSub: true, parent: root });
    }
  }

  // Completed items
  const completed = todoItems.filter((i) => i.isCompleted);
  const completedRoots = completed.filter((i) => !i.parentId);
  const completedFlat: FlattenedTodoRow[] = [];

  for (const root of completedRoots) {
    completedFlat.push({ item: root, isSub: false, parent: null });
    const subs = completed.filter((i) => i.parentId === root.id);
    for (const sub of subs) {
      completedFlat.push({ item: sub, isSub: true, parent: root });
    }
  }

  return {
    rawItems: todoItems,
    uncompletedFlat,
    completedFlat,
    uncompletedCount: uncompletedRoots.length,
    completedCount: completedRoots.length,
    loading,
  };
}
