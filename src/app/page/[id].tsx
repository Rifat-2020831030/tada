import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useDocument } from '../../hooks/useDocuments';
import { TodoPage } from '../../components/todo-page/TodoPage';
import { useTheme } from '../../theme';

export default function PageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { document, loading } = useDocument(id || '');

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!document) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.textSecondary }}>Note not found.</Text>
      </View>
    );
  }

  switch (document.type) {
    case 'todo':
      return <TodoPage document={document} />;
    default:
      return (
        <View style={[styles.center, { backgroundColor: colors.bg }]}>
          <Text style={{ color: colors.textSecondary }}>Unknown document type.</Text>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
