import { database } from '../../index';
import { createDocument } from '../documents';
import {
  createTodoItem,
  updateTodoText,
  toggleTodoComplete,
  deleteTodoItem,
  updateTodoPosition,
} from '../todoItems';
import { TodoItem } from '../../models/TodoItem';

describe('TodoItems queries', () => {
  let documentId: string;

  beforeEach(async () => {
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });

    const doc = await createDocument('todo', 'My List');
    documentId = doc.id;
  });

  it('should create a todo item with correct position', async () => {
    const item1 = await createTodoItem(documentId, null, 'Task 1');
    expect(item1.documentId).toBe(documentId);
    expect(item1.text).toBe('Task 1');
    expect(item1.isCompleted).toBe(false);
    expect(item1.position).toBeDefined();

    const item2 = await createTodoItem(documentId, null, 'Task 2');
    expect(item2.position > item1.position).toBe(true);

    // Create item after item1
    const item3 = await createTodoItem(documentId, item1.position, 'Task 3');
    expect(item3.position > item1.position).toBe(true);
    expect(item3.position < item2.position).toBe(true);
  });

  it('should update todo item text', async () => {
    const item = await createTodoItem(documentId, null, 'Old text');
    await updateTodoText(item, 'New text');
    expect(item.text).toBe('New text');

    const fetched = await database.get<TodoItem>('todo_items').find(item.id);
    expect(fetched.text).toBe('New text');
  });

  it('should toggle completion properly', async () => {
    const item = await createTodoItem(documentId, null, 'Task');
    
    await toggleTodoComplete(item);
    expect(item.isCompleted).toBe(true);
    expect(item.completedAt).toBeDefined();

    const fetchedItem = await database.get<TodoItem>('todo_items').find(item.id);
    expect(fetchedItem.isCompleted).toBe(true);

    await toggleTodoComplete(fetchedItem);
    expect(fetchedItem.isCompleted).toBe(false);
  });

  it('should delete todo item', async () => {
    const item = await createTodoItem(documentId, null, 'Task');

    const beforeCount = await database.get<TodoItem>('todo_items').query().fetch();
    expect(beforeCount.length).toBe(1);

    await deleteTodoItem(item);

    const afterCount = await database.get<TodoItem>('todo_items').query().fetch();
    expect(afterCount.length).toBe(0);
  });

  it('should update todo position', async () => {
    const item = await createTodoItem(documentId, null, 'Task');
    await updateTodoPosition(item, 'new-pos-xyz');
    expect(item.position).toBe('new-pos-xyz');

    const fetched = await database.get<TodoItem>('todo_items').find(item.id);
    expect(fetched.position).toBe('new-pos-xyz');
  });
});
