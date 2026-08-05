import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../db';
import { Document } from '../db/models/Document';
import { TodoItem } from '../db/models/TodoItem';
import { cleanupEmptyDocuments } from '../db/queries/documents';

export function useDocuments(searchQuery: string = '') {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Run cleanup for any empty documents on load
    cleanupEmptyDocuments();

    const docCollection = database.get<Document>('documents');
    const docQuery = docCollection.query(
      Q.where('is_archived', false),
      Q.sortBy('position', Q.asc)
    );

    const subscription = docQuery.observe().subscribe(async (docs) => {
      const allItems = await database.get<TodoItem>('todo_items').query().fetch();

      // Filter out empty notes (no title AND no items with text)
      const validDocs = docs.filter((doc) => {
        const items = allItems.filter((i) => i.documentId === doc.id);
        const hasTitle = doc.title && doc.title.trim().length > 0;
        const hasItemWithText = items.some((i) => i.text && i.text.trim().length > 0);
        return hasTitle || hasItemWithText;
      });

      if (!searchQuery.trim()) {
        setDocuments(validDocs);
      } else {
        const queryLower = searchQuery.toLowerCase();
        const filtered = validDocs.filter((doc) => {
          const titleMatch = doc.title.toLowerCase().includes(queryLower);
          const items = allItems.filter((i) => i.documentId === doc.id);
          const itemMatch = items.some((i) => i.text.toLowerCase().includes(queryLower));
          return titleMatch || itemMatch;
        });
        setDocuments(filtered);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [searchQuery]);

  return { documents, loading };
}

export function useDocument(documentId: string) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!documentId) return;

    const collection = database.get<Document>('documents');
    const observable = collection.findAndObserve(documentId);

    const subscription = observable.subscribe(
      (doc) => {
        setDocument(doc);
        setLoading(false);
      },
      (err) => {
        setDocument(null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [documentId]);

  return { document, loading };
}
