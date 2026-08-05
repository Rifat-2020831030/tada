import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { database } from '../db';
import { Document } from '../db/models/Document';
import { TodoItem } from '../db/models/TodoItem';
import { generateKeyBetween } from 'fractional-indexing';

export async function exportAllData(): Promise<void> {
  const documents = await database.get<Document>('documents').query().fetch();
  const todoItems = await database.get<TodoItem>('todo_items').query().fetch();

  const exportPayload = {
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    appId: 'com.keeptodo.app',
    documents: documents.map((doc) => {
      const items = todoItems.filter((i) => i.documentId === doc.id);
      return {
        id: doc.id,
        type: doc.type,
        title: doc.title,
        color: doc.color,
        isPinned: doc.isPinned,
        isArchived: doc.isArchived,
        position: doc.position,
        createdAt: doc.createdAt ? doc.createdAt.getTime() : Date.now(),
        updatedAt: doc.updatedAt ? doc.updatedAt.getTime() : Date.now(),
        todoItems: items.map((item) => ({
          id: item.id,
          parentId: item.parentId,
          text: item.text,
          isCompleted: item.isCompleted,
          completedAt: item.completedAt ? item.completedAt.getTime() : null,
          position: item.position,
          previousPosition: item.previousPosition,
          createdAt: item.createdAt ? item.createdAt.getTime() : Date.now(),
        })),
      };
    }),
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const filePath = `${FileSystem.cacheDirectory}keeptodo_backup_${Date.now()}.json`;

  await FileSystem.writeAsStringAsync(filePath, jsonString);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath);
  }
}

export async function importData(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, count: 0 };
    }

    const fileUri = result.assets[0].uri;
    const jsonContent = await FileSystem.readAsStringAsync(fileUri);
    const parsed = JSON.parse(jsonContent);

    if (!parsed.documents || !Array.isArray(parsed.documents)) {
      return { success: false, count: 0, error: 'Invalid JSON backup format.' };
    }

    let importedCount = 0;

    await database.write(async () => {
      const docCollection = database.get<Document>('documents');
      const itemCollection = database.get<TodoItem>('todo_items');

      for (const docData of parsed.documents) {
        // Create document
        const createdDoc = await docCollection.create((doc) => {
          doc.type = docData.type || 'todo';
          doc.title = docData.title || '';
          doc.color = docData.color || 'default';
          doc.isPinned = !!docData.isPinned;
          doc.isArchived = !!docData.isArchived;
          doc.position = docData.position || generateKeyBetween(null, null);
        });

        importedCount++;

        // Id mapping for parents/sub-todos
        const idMap: Record<string, string> = {};

        if (Array.isArray(docData.todoItems)) {
          // First pass: create root items
          const rootData = docData.todoItems.filter((i: any) => !i.parentId);
          for (const r of rootData) {
            const createdRoot = await itemCollection.create((item) => {
              item.documentId = createdDoc.id;
              item.parentId = null;
              item.text = r.text || '';
              item.isCompleted = !!r.isCompleted;
              item.completedAt = r.completedAt ? new Date(r.completedAt) : null;
              item.position = r.position || generateKeyBetween(null, null);
              item.previousPosition = r.previousPosition || null;
            });
            idMap[r.id] = createdRoot.id;
          }

          // Second pass: create sub-items mapped to new root IDs
          const subData = docData.todoItems.filter((i: any) => i.parentId);
          for (const s of subData) {
            const mappedParentId = idMap[s.parentId] || null;
            await itemCollection.create((item) => {
              item.documentId = createdDoc.id;
              item.parentId = mappedParentId;
              item.text = s.text || '';
              item.isCompleted = !!s.isCompleted;
              item.completedAt = s.completedAt ? new Date(s.completedAt) : null;
              item.position = s.position || generateKeyBetween(null, null);
              item.previousPosition = s.previousPosition || null;
            });
          }
        }
      }
    });

    return { success: true, count: importedCount };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message || 'Failed to parse file.' };
  }
}
