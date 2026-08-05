import { database } from '../../db';
import { Document } from '../../db/models/Document';
import { exportAllData, importData } from '../importExport';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { createDocument } from '../../db/queries/documents';
import { createTodoItem } from '../../db/queries/todoItems';

describe('importExport utilities', () => {
  beforeEach(async () => {
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
    jest.clearAllMocks();
  });

  it('should export all data correctly', async () => {
    const doc = await createDocument('todo', 'Export Doc', 'blue');
    await createTodoItem(doc.id, null, 'Task 1');

    await exportAllData();

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    const [calledPath, jsonContent] = (FileSystem.writeAsStringAsync as jest.Mock).mock.calls[0];
    expect(calledPath).toContain('keeptodo_backup_');
    expect(calledPath).toContain('.json');

    const parsed = JSON.parse(jsonContent);
    expect(parsed.exportVersion).toBe(1);
    expect(parsed.appId).toBe('com.keeptodo.app');
    expect(parsed.documents.length).toBe(1);
    expect(parsed.documents[0].title).toBe('Export Doc');
    expect(parsed.documents[0].color).toBe('blue');
    expect(parsed.documents[0].todoItems.length).toBe(1);
    expect(parsed.documents[0].todoItems[0].text).toBe('Task 1');

    expect(Sharing.shareAsync).toHaveBeenCalledWith(calledPath);
  });

  it('should import data correctly and reconstruct document/todo hierarchy', async () => {
    const importPayload = {
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      appId: 'com.keeptodo.app',
      documents: [
        {
          id: 'imported-doc-1',
          type: 'todo',
          title: 'Imported Title',
          color: 'purple',
          isPinned: true,
          isArchived: false,
          position: 'a',
          todoItems: [
            {
              id: 'imported-todo-1',
              text: 'Root Import Task',
              isCompleted: false,
              position: 'a1',
            },
            {
              id: 'imported-todo-2',
              text: 'Sub Import Task',
              isCompleted: true,
              completedAt: Date.now(),
              position: 'a1-sub',
            }
          ]
        }
      ]
    };

    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify(importPayload));

    const result = await importData();

    expect(result.success).toBe(true);
    expect(result.count).toBe(1);

    const documents = await database.get<Document>('documents').query().fetch();
    expect(documents.length).toBe(1);
    expect(documents[0].title).toBe('Imported Title');
    expect(documents[0].color).toBe('purple');
    expect(documents[0].isPinned).toBe(true);

    const todoItems = await database.get('todo_items').query().fetch();
    expect(todoItems.length).toBe(2);

    const rootTodo: any = todoItems.find((t: any) => t.text === 'Root Import Task');
    const subTodo: any = todoItems.find((t: any) => t.text === 'Sub Import Task');

    expect(rootTodo).toBeDefined();
    expect(rootTodo.text).toBe('Root Import Task');
    expect(rootTodo.isCompleted).toBe(false);

    expect(subTodo).toBeDefined();
    expect(subTodo.text).toBe('Sub Import Task');
    expect(subTodo.isCompleted).toBe(true);
  });

  it('should return error when file is invalid during import', async () => {
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify({ invalid: 'format' }));

    const result = await importData();
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid JSON backup format');
  });

  it('should handle cancel during import', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({ canceled: true });

    const result = await importData();
    expect(result.success).toBe(false);
    expect(result.count).toBe(0);
  });
});
