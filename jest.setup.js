// Mock Expo FileSystem
jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///mock-cache-dir/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue('{}'),
}), { virtual: true });

// Mock Expo Sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}), { virtual: true });

// Mock Expo DocumentPicker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///mock-selected-file.json' }]
  }),
}), { virtual: true });
