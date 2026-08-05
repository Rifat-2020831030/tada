import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  TouchableOpacity,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Checkbox } from '../common/Checkbox';
import { useTheme } from '../../theme';
import { TodoItem as TodoItemModel } from '../../db/models/TodoItem';
import { updateTodoText, toggleTodoComplete, deleteTodoItem } from '../../db/queries/todoItems';
import { useUIStore } from '../../stores/uiStore';

interface TodoItemRowProps {
  item: TodoItemModel;
  onEnter: (item: TodoItemModel) => void;
  onDeleteOnEmpty: (item: TodoItemModel) => void;
  dragHandle?: React.ReactNode;
}

export const TodoItemRow = ({
  item,
  onEnter,
  onDeleteOnEmpty,
  dragHandle,
}: TodoItemRowProps) => {
  const { colors } = useTheme();
  const activeInputItemId = useUIStore((state) => state.activeInputItemId);
  const setActiveInputItemId = useUIStore((state) => state.setActiveInputItemId);
  const inputRef = useRef<RNTextInput>(null);

  const [localText, setLocalText] = useState(item.text);
  const isActiveFocus = activeInputItemId === item.id;

  // Sync with item.text when DB updates externally, but only if not actively typing
  // This fixes the cursor jumping bug caused by delayed reactive DB updates.
  useEffect(() => {
    if (inputRef.current && !inputRef.current.isFocused()) {
      setLocalText(item.text);
    }
  }, [item.text]);

  // Safely focus input only when target active focus changes and not already focused
  useEffect(() => {
    if (isActiveFocus && inputRef.current && !inputRef.current.isFocused()) {
      inputRef.current.focus();
    }
  }, [isActiveFocus]);

  const handleTextChange = (text: string) => {
    setLocalText(text);
    updateTodoText(item, text);
  };

  const handleToggle = () => {
    toggleTodoComplete(item);
  };

  const handleDelete = () => {
    deleteTodoItem(item);
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Backspace' && localText === '') {
      onDeleteOnEmpty(item);
    }
  };

  return (
    <View
      style={[
        styles.rowContainer,
        {
          opacity: item.isCompleted ? 0.6 : 1,
        },
      ]}
    >
      {/* Drag handle on left */}
      {dragHandle ? <View style={styles.dragHandle}>{dragHandle}</View> : null}

      {/* Checkbox */}
      <Checkbox checked={item.isCompleted} onToggle={handleToggle} />

      {/* Text Input */}
      <RNTextInput
        ref={inputRef}
        value={localText}
        onChangeText={handleTextChange}
        onSubmitEditing={() => onEnter(item)}
        onKeyPress={handleKeyPress}
        onFocus={() => setActiveInputItemId(item.id)}
        placeholder="List item"
        placeholderTextColor={colors.textSecondary}
        returnKeyType="next"
        blurOnSubmit={false}
        multiline={false}
        style={[
          styles.textInput,
          {
            color: colors.text,
            textDecorationLine: item.isCompleted ? 'line-through' : 'none',
            fontSize: 16,
          },
        ]}
      />

      {/* Delete X icon */}
      <TouchableOpacity onPress={handleDelete} style={styles.deleteButton} activeOpacity={0.7}>
        <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    paddingLeft: 12,
    paddingVertical: 6,
    minHeight: 44,
  },
  dragHandle: {
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  deleteButton: {
    padding: 6,
  },
});
