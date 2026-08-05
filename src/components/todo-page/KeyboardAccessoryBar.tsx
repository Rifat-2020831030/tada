import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, InputAccessoryView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface KeyboardAccessoryBarProps {
  onAddItem?: () => void;
  nativeID?: string;
}

export const KeyboardAccessoryBar = ({
  onAddItem,
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
    justifyContent: 'flex-start',
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
});
