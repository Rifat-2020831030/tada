import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../db';
import { Document } from '../db/models/Document';

export function useDocuments(searchQuery: string = '') {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const collection = database.get<Document>('documents');
    const query = collection.query(
      Q.where('is_archived', false),
      Q.sortBy('position', Q.asc)
    );

    const subscription = query.observe().subscribe((docs) => {
      if (!searchQuery.trim()) {
        setDocuments(docs);
      } else {
        const queryLower = searchQuery.toLowerCase();
        const filtered = docs.filter((doc) => doc.title.toLowerCase().includes(queryLower));
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
