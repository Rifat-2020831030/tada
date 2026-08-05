import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface AddItemRowProps {
  onPress: () => void;
}

export const AddItemRow = ({ onPress }: AddItemRowProps) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.container}>
      <MaterialCommunityIcons name="plus" size={22} color={colors.textSecondary} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>List item</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 10,
    gap: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '400',
  },
});
