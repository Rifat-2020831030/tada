import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { NativeModules, Platform } from 'react-native';
import { schema } from './schema';
import { migrations } from './migrations';
import { Document } from './models/Document';
import { TodoItem } from './models/TodoItem';

// Check if native WatermelonDB module is present in binary (Custom Dev Build / Bare React Native)
// In Expo Go or Web, WMDatabaseBridge is not defined in the client app, so fallback to LokiJSAdapter
const isWMBridgeAvailable = Platform.OS !== 'web' && !!NativeModules.WMDatabaseBridge;

const adapter =
  process.env.NODE_ENV === 'test'
    ? new LokiJSAdapter({
        schema,
        migrations,
        useWebWorker: false,
        useIncrementalIndexedDB: false,
      })
    : isWMBridgeAvailable
    ? new SQLiteAdapter({
        schema,
        migrations,
        dbName: 'keeptodo',
        jsi: false,
        onSetUpError: (error) => {
          console.error('WatermelonDB Native setup error:', error);
        },
      })
    : new LokiJSAdapter({
        schema,
        migrations,
        useWebWorker: false,
        useIncrementalIndexedDB: false,
        onSetUpError: (error) => {
          console.error('WatermelonDB LokiJS setup error:', error);
        },
      });

export const database = new Database({
  adapter,
  modelClasses: [Document, TodoItem],
});
