import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { createDocument } from '../../db/queries/documents';

export const FAB = () => {
  const router = useRouter();
  const { colors } = useTheme();

  const handleCreateNewNote = async () => {
    const doc = await createDocument('todo');
    router.push({ pathname: '/page/[id]', params: { id: doc.id } } as any);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handleCreateNewNote}
      style={[styles.fab, { backgroundColor: colors.accentBg, borderColor: colors.border }]}
    >
      <MaterialCommunityIcons name="plus" size={28} color={colors.accent} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
