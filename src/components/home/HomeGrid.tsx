import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Document } from '../../db/models/Document';
import { PageCard } from './PageCard';
import { useUIStore } from '../../stores/uiStore';

interface HomeGridProps {
  documents: Document[];
}

export const HomeGrid = ({ documents }: HomeGridProps) => {
  const { colors } = useTheme();
  const homeViewMode = useUIStore((state) => state.homeViewMode);

  const pinnedDocs = documents.filter((d) => d.isPinned);
  const unpinnedDocs = documents.filter((d) => !d.isPinned);

  if (documents.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="lightbulb-outline" size={72} color={colors.textDisabled} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Notes you add appear here
        </Text>
      </View>
    );
  }

  const renderCardList = (docs: Document[]) => {
    if (homeViewMode === 'list') {
      return (
        <View style={styles.singleColumn}>
          {docs.map((doc) => (
            <PageCard key={doc.id} document={doc} />
          ))}
        </View>
      );
    }

    // 2-column layout
    const leftCol: Document[] = [];
    const rightCol: Document[] = [];

    docs.forEach((doc, idx) => {
      if (idx % 2 === 0) {
        leftCol.push(doc);
      } else {
        rightCol.push(doc);
      }
    });

    return (
      <View style={styles.twoColumn}>
        <View style={styles.column}>
          {leftCol.map((doc) => (
            <PageCard key={doc.id} document={doc} />
          ))}
        </View>
        <View style={styles.column}>
          {rightCol.map((doc) => (
            <PageCard key={doc.id} document={doc} />
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {pinnedDocs.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PINNED</Text>
          {renderCardList(pinnedDocs)}
        </View>
      )}

      {unpinnedDocs.length > 0 && (
        <View style={styles.section}>
          {pinnedDocs.length > 0 && (
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>OTHERS</Text>
          )}
          {renderCardList(unpinnedDocs)}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 80,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  singleColumn: {
    width: '100%',
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '400',
  },
});
