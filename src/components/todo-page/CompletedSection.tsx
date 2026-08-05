import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface CompletedSectionHeaderProps {
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export const CompletedSectionHeader = ({
  count,
  isExpanded,
  onToggle,
}: CompletedSectionHeaderProps) => {
  const { colors } = useTheme();

  if (count === 0) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onToggle}
      style={[styles.container, { borderTopColor: colors.divider }]}
    >
      <View style={styles.left}>
        <MaterialCommunityIcons name="check" size={16} color={colors.textSecondary} />
        <Text style={[styles.title, { color: colors.textSecondary }]}>
          {count} completed {count === 1 ? 'item' : 'items'}
        </Text>
      </View>
      <MaterialCommunityIcons
        name={isExpanded ? 'chevron-up' : 'chevron-down'}
        size={22}
        color={colors.textSecondary}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    marginTop: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
  },
});
