import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseProvider } from '@nozbe/watermelondb/DatabaseProvider';
import { database } from './src/database/simpleDatabase';
import TestDatabaseScreen from './src/screens/TestDatabaseScreen';

export default function App() {
  return (
    <DatabaseProvider database={database}>
      <PaperProvider>
        <SafeAreaProvider>
          <TestDatabaseScreen />
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </PaperProvider>
    </DatabaseProvider>
  );
}

