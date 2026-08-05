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
  isSub?: boolean;
  isActive?: boolean;
  onEnter: (item: TodoItemModel) => void;
  onDeleteOnEmpty: (item: TodoItemModel) => void;
  dragHandle?: React.ReactNode;
}

export const TodoItemRow = ({
  item,
  isSub = false,
  isActive = false,
  onEnter,
  onDeleteOnEmpty,
  dragHandle,
}: TodoItemRowProps) => {
  const { colors } = useTheme();
  const activeInputItemId = useUIStore((state) => state.activeInputItemId);
  const setActiveInputItemId = useUIStore((state) => state.setActiveInputItemId);
  const inputRef = useRef<RNTextInput>(null);

  const [localText, setLocalText] = useState(item.text);
  const [isChecked, setIsChecked] = useState(item.isCompleted);
  const isActiveFocus = activeInputItemId === item.id;

  // Sync with item.text and item.isCompleted when DB updates externally
  useEffect(() => {
    setLocalText(item.text);
  }, [item.text]);

  useEffect(() => {
    setIsChecked(item.isCompleted);
  }, [item.isCompleted]);

  // Safely focus input only when target active focus changes and not already focused
  useEffect(() => {
    if (isActiveFocus && inputRef.current) {
      const timer = setTimeout(() => {
        if (inputRef.current && !inputRef.current.isFocused()) {
          inputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isActiveFocus]);

  const handleTextChange = (text: string) => {
    setLocalText(text);
    updateTodoText(item, text);
  };

  const handleToggle = () => {
    setIsChecked(!isChecked);
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
          paddingLeft: isSub ? 36 : 12,
          opacity: isChecked ? 0.6 : 1,
          backgroundColor: isActive ? colors.bgElevated : 'transparent',
          borderRadius: isActive ? 8 : 0,
        },
      ]}
    >
      {/* Drag handle on left (root item only) */}
      {!isSub && dragHandle ? <View style={styles.dragHandle}>{dragHandle}</View> : null}

      {/* Checkbox */}
      <Checkbox checked={isChecked} onToggle={handleToggle} isSub={isSub} />

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
            fontSize: isSub ? 15 : 16,
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
