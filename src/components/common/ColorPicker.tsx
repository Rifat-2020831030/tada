import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { NoteColor } from '../../types';

interface ColorPickerProps {
  selectedColor: NoteColor;
  onSelectColor: (color: NoteColor) => void;
}

const colorKeys: NoteColor[] = [
  'default',
  'red',
  'pink',
  'orange',
  'yellow',
  'teal',
  'blue',
  'dark_blue',
  'purple',
  'gray',
];

export const ColorPicker = ({ selectedColor, onSelectColor }: ColorPickerProps) => {
  const { colors } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {colorKeys.map((key) => {
        const bgHex = colors.noteColors[key];
        const isSelected = selectedColor === key;

        return (
          <TouchableOpacity
            key={key}
            onPress={() => onSelectColor(key)}
            style={[
              styles.swatch,
              { backgroundColor: bgHex, borderColor: isSelected ? colors.accent : colors.border },
            ]}
          >
            {isSelected && (
              <MaterialCommunityIcons
                name="check"
                size={18}
                color={colors.text}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
