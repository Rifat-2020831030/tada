import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useUIStore } from '../../stores/uiStore';

interface SearchBarProps {
  query: string;
  onQueryChange: (text: string) => void;
  onOpenSettings?: () => void;
}

export const SearchBar = ({ query, onQueryChange, onOpenSettings }: SearchBarProps) => {
  const { colors } = useTheme();
  const homeViewMode = useUIStore((state) => state.homeViewMode);
  const toggleHomeViewMode = useUIStore((state) => state.toggleHomeViewMode);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgElevated }]}>
      <MaterialCommunityIcons name="magnify" size={22} color={colors.textSecondary} style={styles.searchIcon} />

      <TextInput
        value={query}
        onChangeText={onQueryChange}
        placeholder="Search your notes"
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { color: colors.text }]}
      />

      {query.length > 0 ? (
        <TouchableOpacity onPress={() => onQueryChange('')} style={styles.iconButton}>
          <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity onPress={toggleHomeViewMode} style={styles.iconButton} activeOpacity={0.7}>
        <MaterialCommunityIcons
          name={homeViewMode === 'grid' ? 'view-agenda-outline' : 'view-grid-outline'}
          size={22}
          color={colors.text}
        />
      </TouchableOpacity>

      {onOpenSettings && (
        <TouchableOpacity onPress={onOpenSettings} style={styles.iconButton} activeOpacity={0.7}>
          <MaterialCommunityIcons name="cog-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  iconButton: {
    padding: 6,
    borderRadius: 16,
  },
});
