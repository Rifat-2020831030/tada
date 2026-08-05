export type DocumentType = 'todo'; // | 'note' — future extensible

export type NoteColor =
  | 'default'
  | 'red'
  | 'pink'
  | 'orange'
  | 'yellow'
  | 'teal'
  | 'blue'
  | 'dark_blue'
  | 'purple'
  | 'gray';

export interface IDocument {
  id: string;
  type: DocumentType;
  title: string;
  color: NoteColor;
  isPinned: boolean;
  isArchived: boolean;
  position: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITodoItem {
  id: string;
  documentId: string;
  parentId: string | null;
  text: string;
  isCompleted: boolean;
  completedAt: Date | null;
  position: string;
  previousPosition: string | null;
  createdAt: Date;
}
