import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Document } from '../../db/models/Document';
import { TodoItem } from '../../db/models/TodoItem';
import {
  updateDocumentTitle,
  updateDocumentColor,
  togglePinDocument,
  deleteDocument,
} from '../../db/queries/documents';
import {
  createTodoItem,
  deleteTodoItem,
  indentTodoItem,
  outdentTodoItem,
  updateTodoPosition,
} from '../../db/queries/todoItems';
import { useTodoItems, FlattenedTodoRow } from '../../hooks/useTodoItems';
import { TodoItemRow } from './TodoItem';
import { CompletedSectionHeader } from './CompletedSection';
import { AddItemRow } from './AddItemRow';
import { KeyboardAccessoryBar } from './KeyboardAccessoryBar';
import { ColorPicker } from '../common/ColorPicker';
import { useUIStore } from '../../stores/uiStore';
import { NoteColor } from '../../types';
import { positionBetween } from '../../utils/fractionalIndex';

interface TodoPageProps {
  document: Document;
}

export const TodoPage = ({ document }: TodoPageProps) => {
  const router = useRouter();
  const { colors } = useTheme();
  const [title, setTitle] = useState(document.title);
  const [showOptions, setShowOptions] = useState(false);

  const { uncompletedFlat, completedFlat, completedCount } = useTodoItems(document.id);
  const activeInputItemId = useUIStore((state) => state.activeInputItemId);
  const setActiveInputItemId = useUIStore((state) => state.setActiveInputItemId);
  const isCompletedExpanded = useUIStore((state) => state.isCompletedSectionExpanded(document.id));
  const toggleCompletedSection = useUIStore((state) => state.toggleCompletedSection);

  // Active focused item details for indent/outdent eligibility
  const activeRow = uncompletedFlat.find((r) => r.item.id === activeInputItemId);
  const activeIndex = uncompletedFlat.findIndex((r) => r.item.id === activeInputItemId);

  const canIndent = !!(
    activeRow &&
    !activeRow.isSub &&
    activeIndex > 0 &&
    !uncompletedFlat[activeIndex - 1].isSub
  );

  const canOutdent = !!(activeRow && activeRow.isSub);

  const handleBack = async () => {
    const allRows = [...uncompletedFlat, ...completedFlat];
    const hasTitle = title && title.trim().length > 0;
    const hasContent = allRows.some((r) => r.item.text && r.item.text.trim().length > 0);

    if (!hasTitle && !hasContent) {
      await deleteDocument(document);
    }
    router.back();
  };

  const handleTitleChange = (text: string) => {
    setTitle(text);
    updateDocumentTitle(document, text);
  };

  const handleCreateRootItem = async () => {
    const lastUncompleted =
      uncompletedFlat.length > 0 ? uncompletedFlat[uncompletedFlat.length - 1].item : null;
    const newItem = await createTodoItem(
      document.id,
      null,
      lastUncompleted ? lastUncompleted.position : null
    );
    setActiveInputItemId(newItem.id);
  };

  const handleEnterOnItem = async (item: TodoItem) => {
    const parentId = item.parentId;
    const newItem = await createTodoItem(document.id, parentId, item.position);
    setActiveInputItemId(newItem.id);
  };

  const handleDeleteOnEmpty = async (item: TodoItem) => {
    const allFlat = [...uncompletedFlat, ...completedFlat];
    const idx = allFlat.findIndex((r) => r.item.id === item.id);
    const prevItem = idx > 0 ? allFlat[idx - 1].item : null;

    await deleteTodoItem(item);
    setActiveInputItemId(prevItem ? prevItem.id : null);
  };

  const handleIndent = async () => {
    if (!activeRow || activeIndex <= 0) return;
    const itemAbove = uncompletedFlat[activeIndex - 1].item;
    if (!itemAbove.parentId) {
      await indentTodoItem(activeRow.item, itemAbove.id);
    }
  };

  const handleOutdent = async () => {
    if (!activeRow || !activeRow.parent) return;
    await outdentTodoItem(activeRow.item, activeRow.parent);
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

  const handleDragEnd = async ({
    data,
    from,
    to,
  }: {
    data: FlattenedTodoRow[];
    from: number;
    to: number;
  }) => {
    if (from === to) return;

    const movedRow = data[to];
    const prevRow = to > 0 ? data[to - 1] : null;
    const nextRow = to < data.length - 1 ? data[to + 1] : null;

    const newPosition = positionBetween(
      prevRow ? prevRow.item.position : null,
      nextRow ? nextRow.item.position : null
    );

    await updateTodoPosition(movedRow.item, newPosition);
  };

  const renderUncompletedItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<FlattenedTodoRow>) => {
    return (
      <ScaleDecorator>
        <TodoItemRow
          item={item.item}
          isSub={item.isSub}
          onEnter={handleEnterOnItem}
          onDeleteOnEmpty={handleDeleteOnEmpty}
          dragHandle={
            <TouchableOpacity
              onLongPress={drag}
              disabled={isActive}
              delayLongPress={50}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="drag-vertical"
                size={22}
                color={isActive ? colors.accent : colors.textSecondary}
              />
            </TouchableOpacity>
          }
        />
      </ScaleDecorator>
    );
  };

  const cardBg = colors.noteColors[document.color as NoteColor] || colors.bg;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cardBg }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.iconButton} activeOpacity={0.7}>
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

      {/* Main Draggable List */}
      <DraggableFlatList
        data={uncompletedFlat}
        onDragEnd={handleDragEnd}
        keyExtractor={(item) => item.item.id}
        renderItem={renderUncompletedItem}
        keyboardShouldPersistTaps="handled"
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
        ListFooterComponent={
          <View style={styles.footerContainer}>
            {/* Add Item Phantom Row */}
            <AddItemRow onPress={handleCreateRootItem} />

            {/* Completed Section Header */}
            <CompletedSectionHeader
              count={completedCount}
              isExpanded={isCompletedExpanded}
              onToggle={() => toggleCompletedSection(document.id)}
            />

            {/* Completed Items */}
            {isCompletedExpanded &&
              completedFlat.map((row) => (
                <TodoItemRow
                  key={row.item.id}
                  item={row.item}
                  isSub={row.isSub}
                  onEnter={handleEnterOnItem}
                  onDeleteOnEmpty={handleDeleteOnEmpty}
                />
              ))}

            <View style={styles.bottomSpacer} />
          </View>
        }
      />

      {/* Keyboard Toolbar */}
      <KeyboardAccessoryBar
        onIndent={handleIndent}
        onOutdent={handleOutdent}
        onAddItem={handleCreateRootItem}
        canIndent={canIndent}
        canOutdent={canOutdent}
      />

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
  titleInput: {
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footerContainer: {
    paddingBottom: 24,
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
