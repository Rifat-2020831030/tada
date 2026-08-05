import { Q } from '@nozbe/watermelondb';
import { database } from '../index';
import { Document } from '../models/Document';
import { TodoItem } from '../models/TodoItem';
import { NoteColor } from '../../types';
import { initialPosition, positionBefore } from '../../utils/fractionalIndex';

export async function createDocument(type: 'todo' = 'todo', title: string = '', color: NoteColor = 'default'): Promise<Document> {
  return await database.write(async () => {
    const docs = database.get<Document>('documents');
    const firstDoc = (await docs.query(Q.sortBy('position', Q.asc), Q.take(1)).fetch())[0];
    const newPosition = firstDoc ? positionBefore(firstDoc.position) : initialPosition();

    return await docs.create((doc) => {
      doc.type = type;
      doc.title = title;
      doc.color = color;
      doc.isPinned = false;
      doc.isArchived = false;
      doc.position = newPosition;
      doc.updatedAt = new Date();
    });
  });
}

export async function updateDocumentTitle(doc: Document, title: string): Promise<void> {
  await database.write(async () => {
    await doc.update((d) => {
      d.title = title;
      d.updatedAt = new Date();
    });
  });
}

export async function updateDocumentColor(doc: Document, color: NoteColor): Promise<void> {
  await database.write(async () => {
    await doc.update((d) => {
      d.color = color;
      d.updatedAt = new Date();
    });
  });
}

export async function togglePinDocument(doc: Document): Promise<void> {
  await database.write(async () => {
    await doc.update((d) => {
      d.isPinned = !d.isPinned;
      d.updatedAt = new Date();
    });
  });
}

export async function toggleArchiveDocument(doc: Document): Promise<void> {
  await database.write(async () => {
    await doc.update((d) => {
      d.isArchived = !d.isArchived;
      d.updatedAt = new Date();
    });
  });
}

export async function deleteDocument(doc: Document): Promise<void> {
  await database.write(async () => {
    const todoItems = await database.get<TodoItem>('todo_items').query(Q.where('document_id', doc.id)).fetch();
    const preparedDeletes: any[] = todoItems.map((item) => item.prepareDestroyPermanently());
    preparedDeletes.push(doc.prepareDestroyPermanently());
    await database.batch(...preparedDeletes);
  });
}

export async function cleanupEmptyDocuments(): Promise<void> {
  const docs = await database.get<Document>('documents').query().fetch();
  const todoItems = await database.get<TodoItem>('todo_items').query().fetch();

  const deletes: any[] = [];
  for (const doc of docs) {
    const items = todoItems.filter((i) => i.documentId === doc.id);
    const hasTitle = doc.title && doc.title.trim().length > 0;
    const hasItemWithText = items.some((i) => i.text && i.text.trim().length > 0);

    if (!hasTitle && !hasItemWithText) {
      items.forEach((i) => deletes.push(i.prepareDestroyPermanently()));
      deletes.push(doc.prepareDestroyPermanently());
    }
  }

  if (deletes.length > 0) {
    await database.write(async () => {
      await database.batch(...deletes);
    });
  }
}
