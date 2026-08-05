# KeepTodo — Complete App Specification
> React Native · Expo · Offline-first · Google Keep aesthetic

---

## Table of Contents

1. [Vision & Principles](#1-vision--principles)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Project Folder Structure](#3-project-folder-structure)
4. [Data Architecture](#4-data-architecture)
5. [Database Schema (WatermelonDB)](#5-database-schema)
6. [Navigation & Screen Map](#6-navigation--screen-map)
7. [Feature Specifications](#7-feature-specifications)
   - 7.1 [Home Screen](#71-home-screen)
   - 7.2 [Todo Page Screen](#72-todo-page-screen)
   - 7.3 [Todo Item Interactions](#73-todo-item-interactions)
   - 7.4 [Sub-todos](#74-sub-todos)
   - 7.5 [Completed Section](#75-completed-section)
   - 7.6 [Drag to Reorder](#76-drag-to-reorder)
   - 7.7 [Import / Export](#77-import--export)
8. [Component Map](#8-component-map)
9. [State Management](#9-state-management)
10. [Ordering System — Fractional Indexing](#10-ordering-system--fractional-indexing)
11. [Theme System](#11-theme-system)
12. [Performance Strategy](#12-performance-strategy)
13. [Extensibility Model](#13-extensibility-model)
14. [Implementation Roadmap](#14-implementation-roadmap)

---

## 1. Vision & Principles

**What it is:** A fully offline, device-local note-taking and task management app modeled on Google Keep's UX, dark-mode first, with a todo page as the first document type and a clean architecture that allows new document types (rich text notes, etc.) to be added without structural change.

**Core principles:**
- **Offline first, always.** No network calls. No accounts. No sync. All data is in local SQLite.
- **Speed above everything.** Interactions must feel instant. No loading spinners for local reads.
- **Keep's UX, not Keep's limitations.** Adopt the card grid, colors, and gesture language — but build it properly with a clean data model.
- **One-level nesting, hard.** Sub-todos are exactly 1 level deep. No grandchildren. This is a deliberate product constraint.
- **Extensible by design.** The `Document` record is a typed container. Adding a new document type means adding a new type string and a new screen — not touching existing code.

---

## 2. Tech Stack & Dependencies

### Core Runtime
| Layer | Choice | Reason |
|---|---|---|
| Framework | `React Native` + `Expo SDK 51+` | Specified. Managed workflow. |
| Router | `expo-router` v3 | File-based routing, typed navigation, deep links |
| Language | `TypeScript` strict mode | Required for maintainability |

### Database
| Layer | Choice | Reason |
|---|---|---|
| ORM | `@nozbe/watermelondb` | Best offline-first RN DB. Reactive queries = automatic UI updates. Lazy loading. SQLite under the hood. |
| Adapter | `@nozbe/watermelondb/adapters/sqlite` via `expo-sqlite` | Native SQLite, fastest option |

### UI & Gestures
| Layer | Choice | Reason |
|---|---|---|
| Animations | `react-native-reanimated` v3 | Already in Expo. Required for smooth drags and transitions. |
| Gestures | `react-native-gesture-handler` | Already in Expo. Required by DnD and Reanimated. |
| Drag & Drop | `react-native-draggable-flatlist` | Best maintained DnD list for RN. Uses Reanimated internally. |
| Bottom Sheet | `@gorhom/bottom-sheet` | For page options, color picker |
| Icons | `@expo/vector-icons` (MaterialCommunityIcons) | Included in Expo |

### Storage & Utils
| Layer | Choice | Reason |
|---|---|---|
| Preferences | `react-native-mmkv` | Ultra-fast KV store for UI preferences (view mode, theme override, etc.) |
| Ordering | `fractional-indexing` (npm) | Lexicographic position strings for reorder without full renumbering |
| File system | `expo-file-system` | Read/write JSON export files |
| Share | `expo-sharing` | Share exported file to other apps |
| Doc Picker | `expo-document-picker` | Import JSON file |
| Unique IDs | `expo-crypto` (randomUUID) | Stable UUIDs |

### State
| Layer | Choice | Reason |
|---|---|---|
| Server state | WatermelonDB reactive queries (via `useQuery`, `withObservables`) | DB is the source of truth |
| UI state | `zustand` | Lightweight; for ephemeral state (selected items, active dragging, keyboard height) |

### Dev & Quality
- `eslint` + `prettier` + `@typescript-eslint`
- `jest` + `@testing-library/react-native` for unit tests
- `detox` for E2E (optional phase 2)

---

## 3. Project Folder Structure

```
/
├── app/                          # expo-router screens (file = route)
│   ├── _layout.tsx               # Root layout (theme provider, DB provider, gesture handler)
│   ├── index.tsx                 # Home screen (page grid)
│   ├── page/
│   │   └── [id].tsx              # Todo page screen (dynamic route)
│   └── settings.tsx              # Settings (export/import, theme toggle)
│
├── src/
│   ├── components/
│   │   ├── home/
│   │   │   ├── HomeGrid.tsx          # Masonry/grid layout of page cards
│   │   │   ├── PageCard.tsx          # Single card on home screen
│   │   │   ├── SearchBar.tsx         # Top search bar
│   │   │   └── FAB.tsx               # Floating action button
│   │   ├── todo-page/
│   │   │   ├── TodoPage.tsx          # Root of todo page, renders list
│   │   │   ├── TodoList.tsx          # FlatList controller (uncompleted + completed)
│   │   │   ├── TodoItem.tsx          # Root-level todo row
│   │   │   ├── SubTodoItem.tsx       # Indented sub-todo row
│   │   │   ├── CompletedSection.tsx  # Collapsible completed group
│   │   │   ├── DragHandle.tsx        # ≡ icon for drag initiation
│   │   │   └── AddItemRow.tsx        # Phantom input row at bottom of list
│   │   └── common/
│   │       ├── Checkbox.tsx          # Animated checkbox (circle, Keep style)
│   │       ├── ColorPicker.tsx       # Keep color swatches
│   │       ├── BottomSheet.tsx       # Reusable bottom sheet wrapper
│   │       ├── TextInput.tsx         # Custom auto-growing text input
│   │       └── Divider.tsx           # Thin horizontal rule
│   │
│   ├── db/
│   │   ├── index.ts                  # DB instance, adapter config
│   │   ├── schema.ts                 # WatermelonDB schema definition
│   │   ├── migrations.ts             # DB migrations (versioned)
│   │   ├── models/
│   │   │   ├── Document.ts           # Document model
│   │   │   └── TodoItem.ts           # TodoItem model
│   │   └── queries/
│   │       ├── documents.ts          # Document CRUD helpers
│   │       └── todoItems.ts          # TodoItem CRUD helpers
│   │
│   ├── hooks/
│   │   ├── useDocuments.ts           # Reactive list of all documents
│   │   ├── useTodoItems.ts           # Reactive todo items for a document
│   │   ├── useKeyboardHeight.ts      # Keyboard avoidance
│   │   └── useDebounce.ts            # Debounce for title/text saves
│   │
│   ├── stores/
│   │   └── uiStore.ts                # Zustand: selection mode, drag state, etc.
│   │
│   ├── utils/
│   │   ├── fractionalIndex.ts        # generateKeyBetween wrapper + helpers
│   │   ├── importExport.ts           # Serialize/deserialize full data graph
│   │   └── colors.ts                 # Keep color palette constants
│   │
│   ├── theme/
│   │   ├── index.ts                  # ThemeContext + useTheme hook
│   │   ├── colors.ts                 # Dark & light palette
│   │   ├── typography.ts             # Font sizes, weights, line heights
│   │   └── spacing.ts                # 4px base grid
│   │
│   └── types/
│       └── index.ts                  # Shared TypeScript interfaces
│
├── assets/                       # Images, fonts
├── app.json
├── babel.config.js               # Must include reanimated plugin (last)
├── metro.config.js
└── tsconfig.json
```

---

## 4. Data Architecture

### Core Concept: The Document

Everything is a `Document`. A document has a `type` field (`'todo'`, and future types like `'note'`). The type drives which screen and which child records are used. This means the home screen, card grid, search, color system, and import/export are all shared infrastructure.

```
Document (type: 'todo')
├── TodoItem (parentId: null)   ← root todo
│   ├── TodoItem (parentId: root.id)  ← sub-todo
│   └── TodoItem (parentId: root.id)  ← sub-todo
└── TodoItem (parentId: null)   ← another root todo
```

### TypeScript Interfaces

```typescript
// types/index.ts

export type DocumentType = 'todo'; // | 'note' | 'checklist' | 'board' — future

export type NoteColor =
  | 'default' | 'red' | 'pink' | 'orange' | 'yellow'
  | 'teal' | 'blue' | 'dark_blue' | 'purple' | 'gray';

export interface IDocument {
  id: string;
  type: DocumentType;
  title: string;
  color: NoteColor;
  isPinned: boolean;
  isArchived: boolean;
  position: string;         // fractional index for home grid ordering
  createdAt: Date;
  updatedAt: Date;
}

export interface ITodoItem {
  id: string;
  documentId: string;
  parentId: string | null;  // null = root; string = sub-todo (1 level only)
  text: string;
  isCompleted: boolean;
  completedAt: Date | null;
  position: string;         // fractional index WITHIN its scope group
  previousPosition: string | null; // stored on completion; restored on un-complete
  createdAt: Date;
}
```

### Key Design Decisions

**`position` scope:** The `position` fractional index for a `TodoItem` is scoped to its group:
- For root todos: position is among all root todos in the document
- For sub-todos: position is among all sub-todos of the same `parentId`
- Completed and uncompleted items share the same position space per group, but are rendered in separate sections; within each section, they are sorted by `position`

**`previousPosition`:** When a todo is marked complete, its current `position` is copied into `previousPosition` before a new `position` is assigned (at the tail of the completed section). On un-complete, `position` is restored from `previousPosition` and `previousPosition` is cleared. This gives exact position restore.

**Parent completion cascade:** When a root todo is checked:
1. Set `isCompleted = true`, `completedAt = now`, store `previousPosition`
2. For each sub-todo: set `isCompleted = true`, `completedAt = now`, store `previousPosition`
3. All move to the completed section as a visual group

When the root todo is un-checked:
1. Set `isCompleted = false`, restore `position` from `previousPosition`
2. For each sub-todo: set `isCompleted = false`, restore `position` from `previousPosition`

---

## 5. Database Schema

### WatermelonDB Schema

```typescript
// db/schema.ts
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'documents',
      columns: [
        { name: 'type',        type: 'string' },           // 'todo' | future types
        { name: 'title',       type: 'string' },
        { name: 'color',       type: 'string' },           // NoteColor enum value
        { name: 'is_pinned',   type: 'boolean' },
        { name: 'is_archived', type: 'boolean' },
        { name: 'position',    type: 'string' },           // fractional index
        { name: 'created_at',  type: 'number' },
        { name: 'updated_at',  type: 'number' },
      ],
    }),
    tableSchema({
      name: 'todo_items',
      columns: [
        { name: 'document_id',        type: 'string', isIndexed: true },
        { name: 'parent_id',          type: 'string', isOptional: true },  // null safe
        { name: 'text',               type: 'string' },
        { name: 'is_completed',       type: 'boolean' },
        { name: 'completed_at',       type: 'number',  isOptional: true },
        { name: 'position',           type: 'string' },
        { name: 'previous_position',  type: 'string',  isOptional: true },
        { name: 'created_at',         type: 'number' },
      ],
    }),
  ],
});
```

### WatermelonDB Models

```typescript
// db/models/Document.ts
import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text } from '@nozbe/watermelondb/decorators';

export class Document extends Model {
  static table = 'documents';
  static associations = {
    todo_items: { type: 'has_many', foreignKey: 'document_id' },
  };

  @text('type')        type!: string;
  @text('title')       title!: string;
  @text('color')       color!: string;
  @field('is_pinned')  isPinned!: boolean;
  @field('is_archived') isArchived!: boolean;
  @text('position')    position!: string;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at')  updatedAt!: Date;
}

// db/models/TodoItem.ts
import { Model } from '@nozbe/watermelondb';
import { field, date, text, relation } from '@nozbe/watermelondb/decorators';

export class TodoItem extends Model {
  static table = 'todo_items';
  static associations = {
    documents: { type: 'belongs_to', key: 'document_id' },
  };

  @text('document_id')       documentId!: string;
  @text('parent_id')         parentId!: string | null;
  @text('text')              text!: string;
  @field('is_completed')     isCompleted!: boolean;
  @date('completed_at')      completedAt!: Date | null;
  @text('position')          position!: string;
  @text('previous_position') previousPosition!: string | null;
  @readonly @date('created_at') createdAt!: Date;
}
```

### DB Initialization

```typescript
// db/index.ts
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { migrations } from './migrations';
import { Document } from './models/Document';
import { TodoItem } from './models/TodoItem';

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'keeptodo',
  jsi: true,           // JSI for maximum speed on supported platforms
  onSetUpError: (error) => console.error('DB setup error:', error),
});

export const database = new Database({
  adapter,
  modelClasses: [Document, TodoItem],
});
```

---

## 6. Navigation & Screen Map

```
App Root (_layout.tsx)
│  Providers: DatabaseProvider, ThemeProvider, GestureHandlerRootView
│
├── / (index.tsx) — HOME SCREEN
│   ├── Top: SearchBar
│   ├── Body: HomeGrid (pinned section + all pages section)
│   │   └── PageCard (tap → navigate to page)
│   └── Bottom: BottomBar with FAB
│
├── /page/[id] — TODO PAGE SCREEN
│   ├── Top: Back button, title input, options (⋮)
│   ├── Body: TodoList
│   │   ├── [Uncompleted items — draggable]
│   │   ├── [CompletedSection divider — collapsible]
│   │   └── [Completed items — draggable within section]
│   └── Bottom: Floating "Tap to add item" hint
│
└── /settings — SETTINGS SCREEN
    ├── Export all data (JSON)
    ├── Import data (JSON)
    └── Theme (dark/light/system)
```

### Navigation Behavior
- Home → Page: slide-up sheet animation (like Keep's card expand)
- Page → Home: slide-down dismiss
- Back on page: auto-save title (already debounced), pop screen
- Long-press on card: enter multi-select mode (for archive, delete, color)

---

## 7. Feature Specifications

### 7.1 Home Screen

**Layout:**
- 2-column masonry grid (cards have variable height based on content preview)
- Toggle button (top right) switches to single-column list view; preference saved in MMKV
- "Pinned" label above pinned cards; "Others" label above the rest
- Empty state: centered illustration + "Tap + to create a note"

**Page Card (PageCard.tsx):**
- Shows: title (truncated at 2 lines), first 8 todo items as text preview (crossed items shown with strikethrough), color background
- Card height is dynamic (masonry); max 250dp then clips with fade
- Tap → open page
- Long-press → enter selection mode (checkbox appears on card)
- In selection mode: bottom action bar with Archive, Delete, Color, Pin icons

**FAB:**
- Single `+` button (no sub-menu needed for now; future: expand to show document types)
- Creates a new `Document` of type `'todo'` with empty title, navigates to it immediately

**Search:**
- Searches `documents.title` + `todo_items.text` (full text, client-side filter on loaded records)
- Results shown as same card grid
- Search is instant (no debounce needed for local data)

**Pinned behavior:**
- Toggle via long-press → selection bar → Pin icon
- Pinned cards always appear in a separate "Pinned" section above the rest
- Within pinned section, ordering is same fractional-index system

---

### 7.2 Todo Page Screen

**Title:**
- Full-width `TextInput`, auto-grow, `fontSize: 22`, `fontWeight: 'bold'`
- Placeholder: "Title" (faded)
- Saved to DB on every keystroke (debounced 300ms)
- `returnKeyType="next"` focuses the first todo item or AddItemRow

**TodoList:**
- `react-native-draggable-flatlist` wrapping a flat array of items
- The flat array is constructed by flattening the tree in render order: each root item followed immediately by its sub-items
- Sections: uncompleted items, then a divider row (if any completed items exist), then completed items
- ScrollView `keyboardShouldPersistTaps="handled"` so tapping a todo while keyboard is open doesn't dismiss keyboard

**AddItemRow:**
- A permanent phantom row at the bottom of the uncompleted section with a `+` icon and "List item" placeholder text
- Tapping it creates a new root TodoItem at the end of uncompleted items and focuses its input

**Bottom hint:**
- Floating bar at screen bottom (above keyboard): "+ List item" on left, tapping = same as AddItemRow
- "Image, Drawing, etc." icons reserved for future

---

### 7.3 Todo Item Interactions

#### Checkbox
- Tap checkbox → complete/uncomplete (see §7.5 for full flow)
- Animated: circle fills with check mark using Reanimated (spring animation, ~200ms)

#### Text input per item
- `multiline={false}` (single-line per item; text wraps visually but no newlines stored)
- `returnKeyType="next"`
- **`Enter` (submit) on a ROOT todo:** Creates a new root `TodoItem` below the current one (same position scope), moves focus to it
- **`Enter` on a SUB-todo:** Creates a new sub-todo under the same `parentId`, below current, moves focus to it
- **`Backspace` on empty text:** Deletes the item, moves focus to the item above. If item had sub-todos, those are also deleted (cascade). If item is the only item, focus moves to AddItemRow
- **Text change:** Saved to DB debounced 300ms

#### Delete button
- A red `×` icon that appears on the far right of the row (always visible, not swipe-to-reveal)
- Tap: deletes the item (and all sub-items if root). No undo in v1.

#### Drag handle
- `≡` icon on the far left, always visible
- Long-press handle → activates drag mode for that item
- Only the handle initiates drag (not the whole row) to avoid conflicts with text selection

---

### 7.4 Sub-todos

**Creating a sub-todo:**
- No UI button. Only via `Tab` key (hardware keyboard) or a dedicated "sub-item" button in the keyboard accessory bar.
- **Mobile approach:** A keyboard accessory bar (sits above the software keyboard) shows an indent/outdent button when a todo is focused. Tap indent → converts current item into a sub-todo of the item above it.
- Constraint: if there is no item above, indent does nothing. If the item above is already a sub-todo, indent does nothing (no grandchildren).
- A sub-todo cannot be indented further. An outdent converts a sub-todo back to a root todo.

**Visual treatment:**
- Sub-todo rows are indented by 24dp
- Checkbox is slightly smaller (18dp vs 22dp for root)
- No drag handle for sub-todos (they stay under their parent)

**Ordering of sub-todos:**
- Sub-todos are ordered by their own `position` fractional index (scoped to the same `parentId`)
- In the flat render list, sub-todos always appear directly below their parent, before the next root item

**Parent-child completion cascade:**
- Completing a root todo → all its sub-todos complete (see §7.5)
- Un-completing a sub-todo while parent is complete → parent also un-completes (and other sub-todos stay completed; they each restore their own `previousPosition` independently only when explicitly unchecked)
- Un-completing the root → all sub-todos un-complete and all restore `previousPosition`

**Deletion cascade:**
- Deleting a root todo → all its sub-todos are deleted too (WatermelonDB batch delete)

---

### 7.5 Completed Section

**Structure:**
```
[ Uncompleted Root 1        ≡ ]
  [ Uncompleted Sub 1.1       ]
  [ Uncompleted Sub 1.2       ]
[ Uncompleted Root 2        ≡ ]

──── ✓ 2 completed items  ▾ ──── ← tappable divider row

[ Completed Root 1     strikethrough  ≡ ]
  [ Completed Sub 1.1  strikethrough    ]
```

**Divider row:**
- Text: "✓ N completed" where N = count of completed root items
- Right side: `▾` (expanded) or `▸` (collapsed) chevron
- Tap: toggles expanded/collapsed state
- Default: expanded
- Collapsed state hides all completed items from the list (height = 0 or removed from array)
- Collapsed preference saved to MMKV per-document

**Visual treatment of completed items:**
- Text: `textDecorationLine: 'line-through'`, `opacity: 0.6`
- Checkbox: filled/checked state, same size
- Color: muted (same text, just opacity)

**Completing a todo (the full flow):**
1. User taps checkbox on uncompleted root item
2. `previousPosition = item.position`
3. Compute new `position` = `generateKeyBetween(lastCompletedItem.position, null)` (appends to end of completed section)
4. `isCompleted = true`, `completedAt = Date.now()`
5. For each sub-todo of this item: same steps 2–4 (each gets their own `previousPosition`)
6. WatermelonDB batch update (single transaction)
7. Item animates down to completed section (Reanimated layout animation)

**Un-completing a todo (the full flow):**
1. User taps checkbox on a completed root item
2. `position = item.previousPosition` (restore)
3. `previousPosition = null`
4. `isCompleted = false`, `completedAt = null`
5. For each sub-todo: same steps 2–4
6. Batch update
7. Item animates back up to its restored position in uncompleted section

**Un-completing a sub-todo individually:**
1. Same flow as above but only for the sub-todo
2. The root todo ALSO un-completes (since it would be inconsistent to have a parent crossed with an uncrossed child)
3. Other sub-todos remain completed (they are NOT un-completed)

---

### 7.6 Drag to Reorder

**Library:** `react-native-draggable-flatlist`

**Rules:**
- Only uncompleted items can be dragged within the uncompleted zone
- Only completed items can be dragged within the completed zone
- Dragging CANNOT cross the completed/uncompleted boundary (the divider row acts as a wall)
- Sub-todos cannot be individually dragged (they follow their parent)

**How root-todo drag works:**
- User long-presses the `≡` drag handle on a root item
- The drag preview shows the root item AND all its sub-todos as a group (stacked)
- When dropped at a new position among root items, both the root and its sub-todos maintain their relative order and positions

**Implementation detail:**
- The flat list array interleaves root and sub items: `[root1, sub1.1, sub1.2, root2, root3, sub3.1]`
- When a drag starts on `root1`, the drag ghost includes rows for `root1 + sub1.1 + sub1.2`
- The list reorders by root-item groups; sub-items are always kept contiguous below their parent
- On drop: recalculate `position` for the moved root item using `generateKeyBetween(prevRoot.position, nextRoot.position)`. Sub-items' own positions remain unchanged (they're relative to each other, not to the parent's position).

**Position update on drag:**
```
On drop of itemA between itemB and itemC:
  itemA.position = generateKeyBetween(itemB.position, itemC.position)
  // Write to DB in one action (no batch needed — single record)
```

---

### 7.7 Import / Export

#### Export
- Menu: Page options (⋮) → "Export this page" → JSON
- Menu: Settings → "Export all data" → JSON (full dump)
- Output format: see below
- Uses `expo-file-system` to write to `FileSystem.cacheDirectory`
- Uses `expo-sharing` to open share sheet (save to Files, send to app, etc.)

#### Import
- Settings → "Import data" → Opens `expo-document-picker` (filter: `.json`)
- Parsed, validated, and written to DB via WatermelonDB batch create
- On ID collision: imported items get new UUIDs (never overwrite existing data)
- Shows summary toast: "Imported 3 pages"

#### JSON Format

```json
{
  "exportVersion": 1,
  "exportedAt": "2025-06-15T12:00:00Z",
  "appId": "com.yourname.keeptodo",
  "documents": [
    {
      "id": "abc123",
      "type": "todo",
      "title": "Shopping List",
      "color": "teal",
      "isPinned": false,
      "isArchived": false,
      "position": "a0",
      "createdAt": 1718449200000,
      "updatedAt": 1718449200000,
      "todoItems": [
        {
          "id": "item1",
          "parentId": null,
          "text": "Buy milk",
          "isCompleted": false,
          "completedAt": null,
          "position": "a0",
          "previousPosition": null,
          "createdAt": 1718449200000
        },
        {
          "id": "item2",
          "parentId": "item1",
          "text": "2% fat",
          "isCompleted": false,
          "completedAt": null,
          "position": "a0",
          "previousPosition": null,
          "createdAt": 1718449200000
        }
      ]
    }
  ]
}
```

Note: `documentId` is omitted from exported `todoItems` because it's implicit from the nesting. It is re-attached on import.

---

## 8. Component Map

```
HomeScreen
├── SearchBar                 — controlled input, filters document list reactively
├── HomeGrid                  — FlatList with numColumns=2 (or 1 in list view)
│   └── PageCard              — tappable, long-pressable card
├── FAB                       — creates new document and navigates
└── SelectionBar              — appears on long-press; Archive, Delete, Color, Pin

TodoPageScreen
├── Header
│   ├── BackButton
│   ├── TitleInput
│   └── OptionsButton → BottomSheet
│       ├── ColorPicker
│       ├── Pin toggle
│       ├── Archive
│       ├── Delete page
│       └── Export page
├── DraggableTodoList (DraggableFlatList)
│   ├── TodoItem             [root, uncompleted]
│   │   ├── DragHandle
│   │   ├── Checkbox
│   │   ├── TextInput
│   │   └── DeleteButton
│   │   └── SubTodoItem[]    [for each child]
│   │       ├── Checkbox
│   │       ├── TextInput
│   │       └── DeleteButton
│   ├── CompletedDividerRow  [shown when any completed items exist]
│   ├── TodoItem             [root, completed]
│   │   ├── DragHandle
│   │   ├── Checkbox (checked)
│   │   ├── TextInput (strikethrough)
│   │   └── DeleteButton
│   │   └── SubTodoItem[]    [completed sub-items]
│   └── AddItemRow           [always at bottom of uncompleted section]
└── KeyboardAccessoryBar      — indent/outdent buttons, shown when item focused

SettingsScreen
├── ExportButton
├── ImportButton
└── ThemeToggle
```

---

## 9. State Management

### WatermelonDB (source of truth — persistent)
All document and todo item data. Accessed via reactive hooks:
```typescript
// hooks/useTodoItems.ts
import { withObservables } from '@nozbe/with-observables';
import { database } from '../db';

export function useTodoItems(documentId: string) {
  return database.collections
    .get<TodoItem>('todo_items')
    .query(Q.where('document_id', documentId))
    .observe(); // Returns Observable<TodoItem[]>
}
```
UI components subscribe via `observe()` — any DB write auto-re-renders affected components, no manual refresh.

### Zustand (ephemeral UI state)

```typescript
// stores/uiStore.ts
interface UIState {
  // Home
  homeViewMode: 'grid' | 'list';
  selectedDocumentIds: Set<string>;
  isSelectionMode: boolean;

  // Todo page
  activeInputItemId: string | null;       // which item has focus
  isDragging: boolean;
  completedSectionExpanded: Record<string, boolean>; // documentId → bool

  // Actions
  setHomeViewMode: (mode: 'grid' | 'list') => void;
  toggleDocumentSelection: (id: string) => void;
  setActiveInput: (id: string | null) => void;
  toggleCompletedSection: (documentId: string) => void;
}
```

### MMKV (fast persistent preferences)
- `homeViewMode` — persisted across sessions
- `themeOverride` — 'dark' | 'light' | 'system'
- `completedSectionExpanded.{documentId}` — per-page collapse state

---

## 10. Ordering System — Fractional Indexing

**Problem:** When a user reorders items (drag-drop) or inserts an item between two others, naively resequencing all items (position 1, 2, 3...) requires N DB writes. Fractional indexing requires 1 write.

**Solution:** Lexicographic string positions using the `fractional-indexing` library.

**How it works:**
```
Initial items:     a0    a1    a2    a3
Insert between a1 and a2:
  new position = generateKeyBetween('a1', 'a2') = 'a1V'
Result:            a0    a1    a1V   a2    a3
```
The string `'a1V'` sorts between `'a1'` and `'a2'` lexicographically. Only 1 write needed.

**Utility wrapper:**
```typescript
// utils/fractionalIndex.ts
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';

export function positionBetween(before: string | null, after: string | null): string {
  return generateKeyBetween(before ?? null, after ?? null);
}

export function initialPosition(): string {
  return generateKeyBetween(null, null); // 'a0'
}

export function positionAfter(last: string): string {
  return generateKeyBetween(last, null);
}

export function positionBefore(first: string): string {
  return generateKeyBetween(null, first);
}
```

**Query pattern** — items are always fetched sorted by position:
```typescript
Q.where('document_id', documentId),
Q.where('parent_id', Q.eq(null)),           // root items only
Q.sortBy('position', Q.asc)
```

---

## 11. Theme System

### Color Palette — Dark Mode (Default)

```typescript
// theme/colors.ts
export const dark = {
  // Backgrounds
  bg:           '#202124',   // Google Keep dark bg
  bgCard:       '#202124',   // Card default
  bgElevated:   '#2D2E30',   // Bottom sheet, modals
  bgInput:      '#2D2E30',   // Input fields

  // Text
  text:         '#E8EAED',   // Primary text
  textSecondary:'#9AA0A6',   // Secondary, placeholders
  textDisabled: '#5F6368',

  // Interactive
  accent:       '#8AB4F8',   // Google's blue in dark mode (for FAB, links)
  accentBg:     '#1A3A5C',

  // Divider & borders
  divider:      '#3C4043',
  border:       '#3C4043',

  // Checkbox
  checkboxUnchecked: '#9AA0A6',
  checkboxChecked:   '#8AB4F8',

  // Keep note colors (dark variants)
  noteColors: {
    default:   '#202124',
    red:       '#5C2B29',
    pink:      '#4A1942',
    orange:    '#622A0F',
    yellow:    '#614A19',
    teal:      '#0C625D',
    blue:      '#1E3A5F',
    dark_blue: '#1A237E',
    purple:    '#42275E',
    gray:      '#37393B',
  },
};

export const light = {
  bg:           '#FFFFFF',
  bgCard:       '#FFFFFF',
  bgElevated:   '#F1F3F4',
  bgInput:      '#F1F3F4',
  text:          '#202124',
  textSecondary: '#5F6368',
  textDisabled:  '#9AA0A6',
  accent:        '#1A73E8',
  accentBg:      '#E8F0FE',
  divider:       '#E0E0E0',
  border:        '#E0E0E0',
  checkboxUnchecked: '#5F6368',
  checkboxChecked:   '#1A73E8',
  noteColors: {
    default:   '#FFFFFF',
    red:       '#F28B82',
    pink:      '#F29FBF',
    orange:    '#FBBC04',
    yellow:    '#FFF475',
    teal:      '#CCFF90',
    blue:      '#CBF0F8',
    dark_blue: '#AECBFA',
    purple:    '#D7AEFB',
    gray:      '#E6C9A8',
  },
};
```

### Typography
```typescript
// theme/typography.ts
export const typography = {
  pageTitle:    { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  cardTitle:    { fontSize: 16, fontWeight: '600', lineHeight: 20 },
  todoText:     { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  subTodoText:  { fontSize: 15, fontWeight: '400', lineHeight: 20 },
  label:        { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  caption:      { fontSize: 11, fontWeight: '400', lineHeight: 15 },
};
```

### Spacing (4px grid)
```typescript
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
```

---

## 12. Performance Strategy

| Concern | Strategy |
|---|---|
| DB reads | WatermelonDB lazy loading — only loads records when observed. Home grid only loads document records (not all todo items). |
| DB writes | WatermelonDB batched transactions for multi-record updates (complete cascade). |
| SQLite speed | JSI mode enabled (`jsi: true` in adapter). Bypasses the bridge entirely. |
| Text input lag | Debounce DB writes 300ms. Input is controlled by local `useState`, DB is secondary. |
| List rendering | `DraggableFlatList` with `keyExtractor`, `getItemLayout` where possible. Items are memoized with `React.memo`. |
| Re-renders | Zustand slices (each component subscribes to only what it needs). WatermelonDB `observe()` only triggers re-render in subscribed components. |
| Image-free | No images in v1 — no memory/loading concerns. |
| App startup | DB is initialized in `app/_layout.tsx` before first render. `DatabaseProvider` wraps the app. First read is instant (SQLite is always available offline). |
| Keyboard | `KeyboardAvoidingView` + `keyboardShouldPersistTaps="handled"` to prevent jarring keyboard behavior during tap interactions. |

---

## 13. Extensibility Model

### Adding a New Document Type (e.g., Rich Text Note)

The architecture is designed so that new document types require **zero changes to existing code**:

1. **Add the type string** to the `DocumentType` union:
   ```typescript
   export type DocumentType = 'todo' | 'note';  // added 'note'
   ```

2. **Create new child records table** if needed (e.g., `note_blocks` for block-based rich text). Add to schema + migrations.

3. **Create the screen:** `/app/page/note/[id].tsx` (or handle in the existing `[id].tsx` via a type-based switch)

4. **Update `PageCard`** to render a preview appropriate to the new type (first N chars of note text instead of todo items)

5. **Update the FAB** to offer the new type when tapped (expand into type picker)

6. **Update import/export** to serialize/deserialize the new child records

No changes to: `HomeGrid`, `HomeScreen`, `Document` model, `SearchBar`, color system, pinning, archiving, selection mode.

### Type Switch Pattern

```typescript
// app/page/[id].tsx
export default function PageScreen() {
  const { id } = useLocalSearchParams();
  const document = useDocument(id);

  if (!document) return <LoadingScreen />;

  switch (document.type) {
    case 'todo':  return <TodoPage document={document} />;
    case 'note':  return <NotePage document={document} />; // future
    default:      return <UnknownTypePage />;
  }
}
```

---

## 14. Implementation Roadmap

### Phase 1 — Core (MVP)
**Goal:** Working todo app with all specified interactions

| Task | Notes |
|---|---|
| Project setup | Expo + expo-router + TypeScript + WatermelonDB |
| DB schema + models | Documents + TodoItems |
| Theme system | Dark mode default, ThemeContext |
| Home screen | Grid layout, PageCard, FAB |
| Todo page | Title input, todo list, add item |
| Checkbox + complete flow | With animation |
| Backspace-to-delete | Empty input delete behavior |
| Enter-to-create | New item on submit |
| Completed section | Divider, expand/collapse, strikethrough |
| Un-complete + position restore | previousPosition logic |
| Sub-todo creation | Indent button in keyboard accessory bar |
| Parent-child cascade | Complete/uncomplete cascade |
| Delete button | × button per row, cascade delete |

### Phase 2 — Polish & Reorder
**Goal:** Full drag-and-drop + Keep-quality UX

| Task | Notes |
|---|---|
| Drag-to-reorder root todos | react-native-draggable-flatlist |
| Fractional indexing integration | On drag drop |
| Drag with sub-todo groups | Root drag carries children |
| Drag within completed section | Separate boundary |
| Page color picker | ColorPicker bottom sheet |
| Pin / Archive | From home long-press |
| Keep card animations | Expand animation on open |
| Keyboard accessory bar | Indent/outdent buttons |
| Search | Client-side filter across documents and items |

### Phase 3 — Export / Import + Settings
**Goal:** Data portability

| Task | Notes |
|---|---|
| Export single page to JSON | expo-sharing |
| Export all data to JSON | Full dump |
| Import from JSON | expo-document-picker + validation |
| Settings screen | Theme toggle, export/import |
| MMKV preferences | View mode, section states |

### Phase 4 — Second Document Type
**Goal:** Prove extensibility with Rich Text Note type

| Task | Notes |
|---|---|
| 'note' document type | New DB table: `note_blocks` |
| Rich text editor | Basic: bold, italic, headings via a simple block model |
| FAB type picker | Choose between Todo and Note on create |
| Note card preview | First N chars on home card |

---

## Appendix: Key Edge Cases

| Scenario | Behavior |
|---|---|
| Completing last uncompleted item | Completed section appears; page isn't empty — completed section shows |
| Un-completing when position was at index that no longer exists | Fractional index is still valid; item inserts at the fractional value, which places it relative to remaining items correctly |
| Deleting a parent with sub-todos | Batch delete: parent + all children in one transaction |
| Dragging completed item to a position beyond the divider | Prevented — drag gesture is confined to the list portion (uncompleted or completed). Implemented by ignoring drag attempts that cross the divider row's index |
| Empty document (no todos) | Shows only AddItemRow and hint text; no divider |
| Very long todo text | `numberOfLines` unlimited, text wraps; row height expands; DraggableFlatList handles variable row heights |
| Outdenting a sub-todo | Becomes a root todo, inserted after its former parent with a position just after it |
| App killed mid-drag | No data loss — DB write only happens on drop. Kill during drag = drag cancelled, original position intact |
| Import file with unknown document type | Items imported as-is; their screen will show `UnknownTypePage` until that type is implemented |
```