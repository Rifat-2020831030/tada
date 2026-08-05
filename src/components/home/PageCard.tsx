import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Document } from '../../db/models/Document';
import { useTodoItems } from '../../hooks/useTodoItems';
import { useUIStore } from '../../stores/uiStore';
import { NoteColor } from '../../types';

interface PageCardProps {
  document: Document;
}

export const PageCard = ({ document }: PageCardProps) => {
  const router = useRouter();
  const { colors } = useTheme();
  const { uncompletedFlat, completedFlat } = useTodoItems(document.id);

  const selectedDocumentIds = useUIStore((state) => state.selectedDocumentIds);
  const isSelectionMode = useUIStore((state) => state.isSelectionMode);
  const toggleDocumentSelection = useUIStore((state) => state.toggleDocumentSelection);

  const isSelected = selectedDocumentIds.includes(document.id);

  // Combine items up to 8 rows preview
  const previewItems = [...uncompletedFlat, ...completedFlat].slice(0, 8);

  const handlePress = () => {
    if (isSelectionMode) {
      toggleDocumentSelection(document.id);
    } else {
      router.push({ pathname: '/page/[id]', params: { id: document.id } } as any);
    }
  };

  const handleLongPress = () => {
    toggleDocumentSelection(document.id);
  };

  const cardBg = colors.noteColors[document.color as NoteColor] || colors.bgCard;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: isSelected ? colors.accent : colors.border,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
    >
      {isSelected && (
        <View style={[styles.checkBadge, { backgroundColor: colors.accent }]}>
          <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
        </View>
      )}

      {document.title ? (
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {document.title}
        </Text>
      ) : null}

      <View style={styles.previewContainer}>
        {previewItems.map(({ item, isSub }) => (
          <View key={item.id} style={[styles.previewRow, isSub && styles.subPreviewRow]}>
            <MaterialCommunityIcons
              name={item.isCompleted ? 'checkbox-marked-outline' : 'checkbox-blank-outline'}
              size={14}
              color={item.isCompleted ? colors.checkboxChecked : colors.textSecondary}
            />
            <Text
              style={[
                styles.previewText,
                {
                  color: item.isCompleted ? colors.textSecondary : colors.text,
                  textDecorationLine: item.isCompleted ? 'line-through' : 'none',
                },
              ]}
              numberOfLines={1}
            >
              {item.text || 'List item'}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewContainer: {
    gap: 4,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subPreviewRow: {
    paddingLeft: 12,
  },
  previewText: {
    fontSize: 13,
    flex: 1,
  },
});
