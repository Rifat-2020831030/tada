import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../db';
import { TodoItem } from '../db/models/TodoItem';

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

  const uncompleted = todoItems.filter((i) => !i.isCompleted);
  const completed = todoItems.filter((i) => i.isCompleted);

  return {
    rawItems: todoItems,
    uncompleted,
    completed,
    uncompletedCount: uncompleted.length,
    completedCount: completed.length,
    loading,
  };
}
