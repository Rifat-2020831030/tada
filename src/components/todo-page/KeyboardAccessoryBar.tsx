import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, InputAccessoryView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface KeyboardAccessoryBarProps {
  onIndent?: () => void;
  onOutdent?: () => void;
  onAddItem?: () => void;
  canIndent?: boolean;
  canOutdent?: boolean;
  nativeID?: string;
}

export const KeyboardAccessoryBar = ({
  onIndent,
  onOutdent,
  onAddItem,
  canIndent = false,
  canOutdent = false,
  nativeID = 'todoKeyboardAccessory',
}: KeyboardAccessoryBarProps) => {
  const { colors } = useTheme();

  const content = (
    <View style={[styles.bar, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
      <TouchableOpacity
        onPress={onAddItem}
        style={styles.addButton}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="plus" size={20} color={colors.textSecondary} />
        <Text style={[styles.addText, { color: colors.textSecondary }]}>List item</Text>
      </TouchableOpacity>

      <View style={styles.indentGroup}>
        <TouchableOpacity
          onPress={onOutdent}
          disabled={!canOutdent}
          style={[styles.iconButton, !canOutdent && styles.disabled]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="format-indent-decrease"
            size={22}
            color={canOutdent ? colors.text : colors.textDisabled}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onIndent}
          disabled={!canIndent}
          style={[styles.iconButton, !canIndent && styles.disabled]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="format-indent-increase"
            size={22}
            color={canIndent ? colors.text : colors.textDisabled}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (Platform.OS === 'ios') {
    return <InputAccessoryView nativeID={nativeID}>{content}</InputAccessoryView>;
  }

  return content;
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addText: {
    fontSize: 14,
    fontWeight: '500',
  },
  indentGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 6,
    borderRadius: 6,
  },
  disabled: {
    opacity: 0.4,
  },
});
