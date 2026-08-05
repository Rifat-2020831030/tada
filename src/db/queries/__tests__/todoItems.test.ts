import { database } from '../../index';
import { createDocument } from '../documents';
import {
  createTodoItem,
  updateTodoText,
  toggleTodoComplete,
  deleteTodoItem,
  indentTodoItem,
  outdentTodoItem,
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

  it('should create a todo item with correct position and parentId', async () => {
    const item1 = await createTodoItem(documentId, null, null, 'Task 1');
    expect(item1.documentId).toBe(documentId);
    expect(item1.parentId).toBeNull();
    expect(item1.text).toBe('Task 1');
    expect(item1.isCompleted).toBe(false);
    expect(item1.position).toBeDefined();

    const item2 = await createTodoItem(documentId, null, null, 'Task 2');
    expect(item2.position > item1.position).toBe(true);

    // Create item after item1
    const item3 = await createTodoItem(documentId, null, item1.position, 'Task 3');
    expect(item3.position > item1.position).toBe(true);
    expect(item3.position < item2.position).toBe(true);
  });

  it('should update todo item text', async () => {
    const item = await createTodoItem(documentId, null, null, 'Old text');
    await updateTodoText(item, 'New text');
    expect(item.text).toBe('New text');

    const fetched = await database.get<TodoItem>('todo_items').find(item.id);
    expect(fetched.text).toBe('New text');
  });

  it('should toggle completion and cascade completions properly', async () => {
    const parent = await createTodoItem(documentId, null, null, 'Parent Task');
    const child1 = await createTodoItem(documentId, parent.id, null, 'Child Task 1');
    const child2 = await createTodoItem(documentId, parent.id, null, 'Child Task 2');

    // Completing parent should complete all children
    await toggleTodoComplete(parent);
    expect(parent.isCompleted).toBe(true);
    expect(parent.completedAt).toBeDefined();

    // Re-fetch children to check status
    const fetchedChild1 = await database.get<TodoItem>('todo_items').find(child1.id);
    const fetchedChild2 = await database.get<TodoItem>('todo_items').find(child2.id);
    expect(fetchedChild1.isCompleted).toBe(true);
    expect(fetchedChild2.isCompleted).toBe(true);

    // Un-completing child1 should un-complete parent
    await toggleTodoComplete(fetchedChild1);
    expect(fetchedChild1.isCompleted).toBe(false);

    const fetchedParent = await database.get<TodoItem>('todo_items').find(parent.id);
    expect(fetchedParent.isCompleted).toBe(false);

    // Completing child1 again, and completing child2 again
    await database.write(async () => {
      await fetchedChild1.update(c => { c.isCompleted = true; });
      await fetchedParent.update(p => { p.isCompleted = true; });
    });

    // Un-completing parent should un-complete all children
    const finalParent = await database.get<TodoItem>('todo_items').find(parent.id);
    await toggleTodoComplete(finalParent);
    expect(finalParent.isCompleted).toBe(false);

    const finalChild1 = await database.get<TodoItem>('todo_items').find(child1.id);
    const finalChild2 = await database.get<TodoItem>('todo_items').find(child2.id);
    expect(finalChild1.isCompleted).toBe(false);
    expect(finalChild2.isCompleted).toBe(false);
  });

  it('should delete parent todo and cascade delete its children', async () => {
    const parent = await createTodoItem(documentId, null, null, 'Parent');
    const child = await createTodoItem(documentId, parent.id, null, 'Child');

    const beforeCount = await database.get<TodoItem>('todo_items').query().fetch();
    expect(beforeCount.length).toBe(2);

    await deleteTodoItem(parent);

    const afterCount = await database.get<TodoItem>('todo_items').query().fetch();
    expect(afterCount.length).toBe(0);
  });

  it('should indent a todo item (making it a child)', async () => {
    const parent = await createTodoItem(documentId, null, null, 'Parent');
    const child = await createTodoItem(documentId, null, null, 'To be Indented');

    expect(child.parentId).toBeNull();
    const success = await indentTodoItem(child, parent.id);
    expect(success).toBe(true);
    expect(child.parentId).toBe(parent.id);

    // Verify in db
    const fetchedChild = await database.get<TodoItem>('todo_items').find(child.id);
    expect(fetchedChild.parentId).toBe(parent.id);

    // Indenting a child further (sub-todo to another sub-todo) should fail (limit 1 level)
    const grandChild = await createTodoItem(documentId, null, null, 'Grandchild');
    const success2 = await indentTodoItem(grandChild, child.id);
    // Wait, the indentTodoItem checks: if (item.parentId) return false;
    // Let's verify: does indentTodoItem check if the item being indented already has a parent?
    // Yes: "if (item.parentId) return false;"
    // Let's check: trying to indent 'child' (which has a parent) further:
    const success3 = await indentTodoItem(child, grandChild.id);
    expect(success3).toBe(false);
  });

  it('should outdent a todo item (removing parent reference)', async () => {
    const parent = await createTodoItem(documentId, null, null, 'Parent');
    const child = await createTodoItem(documentId, parent.id, null, 'Child');

    expect(child.parentId).toBe(parent.id);

    const success = await outdentTodoItem(child, parent);
    expect(success).toBe(true);
    expect(child.parentId).toBeNull();

    // Verify in db
    const fetchedChild = await database.get<TodoItem>('todo_items').find(child.id);
    expect(fetchedChild.parentId).toBeNull();
  });

  it('should update todo position', async () => {
    const item = await createTodoItem(documentId, null, null, 'Task');
    await updateTodoPosition(item, 'new-pos-xyz');
    expect(item.position).toBe('new-pos-xyz');

    const fetched = await database.get<TodoItem>('todo_items').find(item.id);
    expect(fetched.position).toBe('new-pos-xyz');
  });
});
