import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { exportAllData, importData } from '../utils/importExport';

export default function SettingsScreen() {
  const router = useRouter();
  const { mode, colors, toggleTheme } = useTheme();
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    try {
      await exportAllData();
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Could not export backup file.');
    }
  };

  const handleImport = async () => {
    setImporting(true);
    const result = await importData();
    setImporting(false);

    if (result.success) {
      Alert.alert('Import Complete', `Successfully imported ${result.count} note(s).`);
    } else if (result.error) {
      Alert.alert('Import Failed', result.error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>

      <View style={styles.content}>
        {/* Theme Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APPEARANCE</Text>

          <View style={[styles.row, { backgroundColor: colors.bgElevated }]}>
            <View style={styles.rowLeft}>
              <MaterialCommunityIcons
                name={mode === 'dark' ? 'weather-night' : 'white-balance-sunny'}
                size={22}
                color={colors.text}
              />
              <Text style={[styles.rowText, { color: colors.text }]}>Dark Theme</Text>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: colors.accentBg }}
              thumbColor={mode === 'dark' ? colors.accent : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Data Import & Export */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DATA PORTABILITY</Text>

          <TouchableOpacity
            style={[styles.row, { backgroundColor: colors.bgElevated }]}
            onPress={handleExport}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <MaterialCommunityIcons name="export-variant" size={22} color={colors.text} />
              <Text style={[styles.rowText, { color: colors.text }]}>Export All Notes (JSON)</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, { backgroundColor: colors.bgElevated, marginTop: 8 }]}
            onPress={handleImport}
            disabled={importing}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <MaterialCommunityIcons name="import" size={22} color={colors.text} />
              <Text style={[styles.rowText, { color: colors.text }]}>
                {importing ? 'Importing...' : 'Import Notes from JSON'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  iconButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
