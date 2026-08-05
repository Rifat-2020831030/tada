import { database } from '../../index';
import { createDocument, updateDocumentTitle, updateDocumentColor, togglePinDocument, toggleArchiveDocument, deleteDocument } from '../documents';
import { TodoItem } from '../../models/TodoItem';
import { Document } from '../../models/Document';

describe('Documents queries', () => {
  beforeEach(async () => {
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
  });

  it('should create a document with default and specified values', async () => {
    const doc1 = await createDocument('todo', 'My Tasks', 'red');
    expect(doc1.title).toBe('My Tasks');
    expect(doc1.color).toBe('red');
    expect(doc1.isPinned).toBe(false);
    expect(doc1.isArchived).toBe(false);
    expect(doc1.position).toBeDefined();

    // Verify it is in database
    const allDocs = await database.get<Document>('documents').query().fetch();
    expect(allDocs.length).toBe(1);
    expect(allDocs[0].id).toBe(doc1.id);
  });

  it('should position new documents before existing ones', async () => {
    const doc1 = await createDocument('todo', 'First Document');
    const doc2 = await createDocument('todo', 'Second Document');

    expect(doc2.position < doc1.position).toBe(true);
  });

  it('should update document title', async () => {
    const doc = await createDocument('todo', 'Original Title');
    await updateDocumentTitle(doc, 'Updated Title');
    expect(doc.title).toBe('Updated Title');

    const fetched = await database.get<Document>('documents').find(doc.id);
    expect(fetched.title).toBe('Updated Title');
  });

  it('should update document color', async () => {
    const doc = await createDocument('todo', 'My Doc', 'default');
    await updateDocumentColor(doc, 'blue');
    expect(doc.color).toBe('blue');

    const fetched = await database.get<Document>('documents').find(doc.id);
    expect(fetched.color).toBe('blue');
  });

  it('should toggle pinned status', async () => {
    const doc = await createDocument('todo', 'My Doc');
    expect(doc.isPinned).toBe(false);

    await togglePinDocument(doc);
    expect(doc.isPinned).toBe(true);

    await togglePinDocument(doc);
    expect(doc.isPinned).toBe(false);
  });

  it('should toggle archived status', async () => {
    const doc = await createDocument('todo', 'My Doc');
    expect(doc.isArchived).toBe(false);

    await toggleArchiveDocument(doc);
    expect(doc.isArchived).toBe(true);

    await toggleArchiveDocument(doc);
    expect(doc.isArchived).toBe(false);
  });

  it('should delete document and cascade delete associated todo items', async () => {
    const doc = await createDocument('todo', 'To Delete');
    
    // Create some todo items manually in database for this doc
    await database.write(async () => {
      await database.get<TodoItem>('todo_items').create((item) => {
        item.documentId = doc.id;
        item.text = 'Task 1';
        item.isCompleted = false;
        item.position = 'a';
      });
      await database.get<TodoItem>('todo_items').create((item) => {
        item.documentId = doc.id;
        item.text = 'Task 2';
        item.isCompleted = false;
        item.position = 'b';
      });
    });

    // Check count before deletion
    const docCountBefore = await database.get<Document>('documents').query().fetch();
    const todoCountBefore = await database.get<TodoItem>('todo_items').query().fetch();
    expect(docCountBefore.length).toBe(1);
    expect(todoCountBefore.length).toBe(2);

    // Delete
    await deleteDocument(doc);

    // Verify both are gone
    const docCountAfter = await database.get<Document>('documents').query().fetch();
    const todoCountAfter = await database.get<TodoItem>('todo_items').query().fetch();
    expect(docCountAfter.length).toBe(0);
    expect(todoCountAfter.length).toBe(0);
  });
});
