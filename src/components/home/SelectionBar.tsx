import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useUIStore } from '../../stores/uiStore';
import { database } from '../../db';
import { Document } from '../../db/models/Document';
import { ColorPicker } from '../common/ColorPicker';
import { NoteColor } from '../../types';
import { deleteDocument, updateDocumentColor, togglePinDocument, toggleArchiveDocument } from '../../db/queries/documents';

export const SelectionBar = () => {
  const { colors } = useTheme();
  const selectedDocumentIds = useUIStore((state) => state.selectedDocumentIds);
  const clearDocumentSelection = useUIStore((state) => state.clearDocumentSelection);

  const [showColorPicker, setShowColorPicker] = useState(false);

  if (selectedDocumentIds.length === 0) return null;

  const count = selectedDocumentIds.length;

  const getSelectedDocs = async (): Promise<Document[]> => {
    const docs = await database.get<Document>('documents').query().fetch();
    return docs.filter((d) => selectedDocumentIds.includes(d.id));
  };

  const handlePinSelected = async () => {
    const docs = await getSelectedDocs();
    for (const doc of docs) {
      await togglePinDocument(doc);
    }
    clearDocumentSelection();
  };

  const handleColorSelected = async (color: NoteColor) => {
    const docs = await getSelectedDocs();
    for (const doc of docs) {
      await updateDocumentColor(doc, color);
    }
    setShowColorPicker(false);
    clearDocumentSelection();
  };

  const handleArchiveSelected = async () => {
    const docs = await getSelectedDocs();
    for (const doc of docs) {
      await toggleArchiveDocument(doc);
    }
    clearDocumentSelection();
  };

  const handleDeleteSelected = async () => {
    const docs = await getSelectedDocs();
    for (const doc of docs) {
      await deleteDocument(doc);
    }
    clearDocumentSelection();
  };

  return (
    <View style={[styles.bar, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
      <View style={styles.left}>
        <TouchableOpacity onPress={clearDocumentSelection} style={styles.iconButton}>
          <MaterialCommunityIcons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.countText, { color: colors.text }]}>{count}</Text>
      </View>

      <View style={styles.right}>
        <TouchableOpacity onPress={handlePinSelected} style={styles.iconButton}>
          <MaterialCommunityIcons name="pin-outline" size={22} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowColorPicker(true)} style={styles.iconButton}>
          <MaterialCommunityIcons name="palette-outline" size={22} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleArchiveSelected} style={styles.iconButton}>
          <MaterialCommunityIcons name="archive-arrow-down-outline" size={22} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDeleteSelected} style={styles.iconButton}>
          <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Modal visible={showColorPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowColorPicker(false)}
        >
          <View style={[styles.colorSheet, { backgroundColor: colors.bgElevated }]}>
            <Text style={[styles.sheetTitle, { color: colors.textSecondary }]}>Change color</Text>
            <ColorPicker selectedColor="default" onSelectColor={handleColorSelected} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    zIndex: 100,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countText: {
    fontSize: 18,
    fontWeight: '600',
  },
  iconButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  colorSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  sheetTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
});
