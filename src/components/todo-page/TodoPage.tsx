import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Document } from '../../db/models/Document';
import { TodoItem as TodoItemModel } from '../../db/models/TodoItem';
import { updateDocumentTitle, updateDocumentColor, togglePinDocument, deleteDocument } from '../../db/queries/documents';
import { createTodoItem, deleteTodoItem } from '../../db/queries/todoItems';
import { useTodoItems } from '../../hooks/useTodoItems';
import { TodoItemRow } from './TodoItem';
import { CompletedSectionHeader } from './CompletedSection';
import { AddItemRow } from './AddItemRow';
import { KeyboardAccessoryBar } from './KeyboardAccessoryBar';
import { ColorPicker } from '../common/ColorPicker';
import { useUIStore } from '../../stores/uiStore';
import { NoteColor } from '../../types';

interface TodoPageProps {
  document: Document;
}

type ListItem =
  | { type: 'todo'; item: TodoItemModel; key: string }
  | { type: 'add-row'; key: string }
  | { type: 'completed-header'; key: string }
  | { type: 'todo-completed'; item: TodoItemModel; key: string };

export const TodoPage = ({ document }: TodoPageProps) => {
  const router = useRouter();
  const { colors } = useTheme();
  const [title, setTitle] = useState(document.title);
  const [showOptions, setShowOptions] = useState(false);

  const { uncompleted, completed, completedCount } = useTodoItems(document.id);
  const setActiveInputItemId = useUIStore((state) => state.setActiveInputItemId);
  const isCompletedExpanded = useUIStore((state) => state.isCompletedSectionExpanded(document.id));
  const toggleCompletedSection = useUIStore((state) => state.toggleCompletedSection);

  const handleTitleChange = (text: string) => {
    setTitle(text);
    updateDocumentTitle(document, text);
  };

  const handleCreateRootItem = async () => {
    const lastUncompleted = uncompleted.length > 0 ? uncompleted[uncompleted.length - 1] : null;
    const newItem = await createTodoItem(document.id, lastUncompleted ? lastUncompleted.position : null);
    setActiveInputItemId(newItem.id);
  };

  const handleEnterOnItem = async (item: TodoItemModel) => {
    const newItem = await createTodoItem(document.id, item.position);
    setActiveInputItemId(newItem.id);
  };

  const handleDeleteOnEmpty = async (item: TodoItemModel) => {
    const allItems = [...uncompleted, ...completed];
    const idx = allItems.findIndex((r) => r.id === item.id);
    const prevItem = idx > 0 ? allItems[idx - 1] : null;

    await deleteTodoItem(item);
    setActiveInputItemId(prevItem ? prevItem.id : null);
  };

  const handleSelectColor = (color: NoteColor) => {
    updateDocumentColor(document, color);
  };

  const handleTogglePin = () => {
    togglePinDocument(document);
  };

  const handleDeletePage = async () => {
    setShowOptions(false);
    await deleteDocument(document);
    router.back();
  };

  const cardBg = colors.noteColors[document.color as NoteColor] || colors.bg;

  const listData: ListItem[] = [
    ...uncompleted.map((item) => ({ type: 'todo' as const, item, key: item.id })),
    { type: 'add-row' as const, key: 'add-row' },
  ];

  if (completedCount > 0) {
    listData.push({ type: 'completed-header' as const, key: 'completed-header' });
    if (isCompletedExpanded) {
      listData.push(...completed.map((item) => ({ type: 'todo-completed' as const, item, key: item.id })));
    }
  }

  const renderItem = ({ item }: { item: ListItem }) => {
    switch (item.type) {
      case 'todo':
        return (
          <TodoItemRow
            item={item.item}
            onEnter={handleEnterOnItem}
            onDeleteOnEmpty={handleDeleteOnEmpty}
            dragHandle={
              <MaterialCommunityIcons name="drag-vertical" size={20} color={colors.textSecondary} />
            }
          />
        );
      case 'add-row':
        return <AddItemRow onPress={handleCreateRootItem} />;
      case 'completed-header':
        return (
          <CompletedSectionHeader
            count={completedCount}
            isExpanded={isCompletedExpanded}
            onToggle={() => toggleCompletedSection(document.id)}
          />
        );
      case 'todo-completed':
        return (
          <TodoItemRow
            item={item.item}
            onEnter={handleEnterOnItem}
            onDeleteOnEmpty={handleDeleteOnEmpty}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cardBg }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleTogglePin} style={styles.iconButton} activeOpacity={0.7}>
            <MaterialCommunityIcons
              name={document.isPinned ? 'pin' : 'pin-outline'}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowOptions(true)} style={styles.iconButton} activeOpacity={0.7}>
            <MaterialCommunityIcons name="dots-vertical" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
        ListHeaderComponent={
          <TextInput
            value={title}
            onChangeText={handleTitleChange}
            placeholder="Title"
            placeholderTextColor={colors.textSecondary}
            multiline
            style={[styles.titleInput, { color: colors.text }]}
          />
        }
        ListFooterComponent={<View style={styles.bottomSpacer} />}
      />

      {/* Keyboard Toolbar */}
      <KeyboardAccessoryBar onAddItem={handleCreateRootItem} />

      {/* Options Modal */}
      <Modal visible={showOptions} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={[styles.optionsSheet, { backgroundColor: colors.bgElevated }]}>
            <Text style={[styles.optionsTitle, { color: colors.textSecondary }]}>Note color</Text>
            <ColorPicker selectedColor={document.color as NoteColor} onSelectColor={handleSelectColor} />

            <View style={[styles.optionsDivider, { backgroundColor: colors.divider }]} />

            <TouchableOpacity style={styles.optionRow} onPress={handleDeletePage}>
              <MaterialCommunityIcons name="trash-can-outline" size={22} color="#F28B82" />
              <Text style={[styles.optionText, { color: '#F28B82' }]}>Delete note</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
  scroll: {
    flex: 1,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bottomSpacer: {
    height: 80,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  optionsSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  optionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  optionsDivider: {
    height: 1,
    marginVertical: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
