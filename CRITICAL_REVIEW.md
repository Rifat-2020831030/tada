# Critical Code Review (Bug Report)

Per your instructions, I have discarded the praise and conducted a deep, critical analysis of the codebase. Below are several severe architectural flaws, UI bugs, and data loss edge cases that currently exist in the app. 

### 1. Vanishing Sub-Items (Silent Data Loss UI)
**File**: `src/hooks/useTodoItems.ts`
**Severity**: CRITICAL
**The Bug**: If a user manually completes a sub-item while the parent item is still uncompleted, **the sub-item completely vanishes from the UI.**
**Why**: 
1. When checking the sub-item, `isCompleted` becomes `true`. It is removed from the `uncompleted` list.
2. In the completed list rendering logic, you filter for `completedRoots = completed.filter(i => !i.parentId)`. 
3. Since the parent is NOT completed, it is not in `completedRoots`. 
4. The loop iterates over `completedRoots` to find and render children. Since the parent isn't there, the completed sub-item is never pushed to `completedFlat`. It is effectively lost until the user blindly guesses to check the parent.

### 2. Broken Indentation Logic (Tree Manipulation Flaw)
**File**: `src/components/todo-page/TodoPage.tsx` and `indentTodoItem` query
**Severity**: HIGH
**The Bug**: A user can only ever create ONE sub-item under a parent using the indent button. Trying to indent a second task under the same parent is impossible.
**Why**: 
In `canIndent` and `handleIndent`, you enforce: `!uncompletedFlat[activeIndex - 1].isSub`. 
If I have `Task A` and `Subtask A1`, and I want to indent `Task B` to become `Subtask A2`, the item above `Task B` is `Subtask A1` (which has `isSub = true`). The logic explicitly disables the indent button and ignores the action. You should instead resolve the potential parent to be the root item above it.

### 3. Asynchronous Text Input Overwrites (Cursor Jumping)
**File**: `src/components/todo-page/TodoItem.tsx`
**Severity**: HIGH
**The Bug**: Typing quickly in a Todo item will cause dropped keystrokes or the cursor to jump to the end of the input.
**Why**: 
You use a controlled `<RNTextInput>` where `onChangeText` writes to the database asynchronously. Because WatermelonDB is reactive, it fires an update back to the component a few milliseconds later, triggering your `useEffect(() => setLocalText(item.text), [item.text])`. This overwrites the user's currently typing text with slightly delayed DB state, destroying the native typing experience.

### 4. "Add Item" Button Positional Corruption
**File**: `src/components/todo-page/TodoPage.tsx`
**Severity**: HIGH
**The Bug**: Clicking the "Add Item" phantom row at the bottom of the list can cause the new item to jump randomly to the TOP of the list instead of the bottom.
**Why**: 
`handleCreateRootItem` grabs `lastUncompleted.position` and passes it as `afterPosition` to `createTodoItem`. If the last item in the flattened list is a sub-item, you pass a child's fractional index string. 
Inside `createTodoItem`, you query `siblingItems` (which are ROOT items) and do a `.findIndex` for the child's position. It returns `-1` (not found). The fallback logic generates a new position between the child's position and `null`, completely ignoring the actual root positions. If the child's position string happens to sort alphabetically before your first root item, the new task teleports to the top of the list.

### 5. ScrollView Performance Collapse
**File**: `src/components/todo-page/TodoPage.tsx`
**Severity**: MEDIUM
**The Bug**: Using `<ScrollView>` with `.map()` for rendering `uncompletedFlat` and `completedFlat`. 
**Why**: 
React Native `<ScrollView>` renders all children immediately regardless of viewport. For a Todo app (where documents frequently exceed 50-100 items), this will cause severe memory bloat and frame drops during scrolling and rendering. This must be migrated to `<FlatList>` or `@shopify/flash-list`.
