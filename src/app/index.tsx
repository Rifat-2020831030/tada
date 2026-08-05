import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme';
import { SearchBar } from '../components/home/SearchBar';
import { HomeGrid } from '../components/home/HomeGrid';
import { SelectionBar } from '../components/home/SelectionBar';
import { FAB } from '../components/home/FAB';
import { useDocuments } from '../hooks/useDocuments';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const { documents } = useDocuments(searchQuery);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <SelectionBar />

      <SearchBar
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onOpenSettings={() => router.push('/settings')}
      />

      <HomeGrid documents={documents} />

      <FAB />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});
