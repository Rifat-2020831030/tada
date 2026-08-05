import { Q } from '@nozbe/watermelondb';
import { database } from '../index';
import { Document } from '../models/Document';
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
    const todoItems = await database.get('todo_items').query(Q.where('document_id', doc.id)).fetch();
    const preparedDeletes = todoItems.map((item) => item.prepareDestroyPermanently());
    preparedDeletes.push(doc.prepareDestroyPermanently());
    await database.batch(...preparedDeletes);
  });
}
