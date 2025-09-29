import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { syncService } from '../services/syncService';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(syncService.isOnlineStatus);
  const [isSyncing, setIsSyncing] = useState(syncService.isSyncInProgress);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Show indicator when offline or syncing
    const shouldShow = !isOnline || isSyncing;
    
    Animated.timing(fadeAnim, {
      toValue: shouldShow ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline, isSyncing, fadeAnim]);

  useEffect(() => {
    // Listen for sync status changes
    const interval = setInterval(() => {
      setIsOnline(syncService.isOnlineStatus);
      setIsSyncing(syncService.isSyncInProgress);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (isOnline && !isSyncing) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Chip
        icon={isSyncing ? 'sync' : 'wifi-off'}
        style={[
          styles.chip,
          { backgroundColor: isSyncing ? '#3B82F6' : '#EF4444' }
        ]}
        textStyle={styles.chipText}
      >
        {isSyncing ? 'Syncing...' : 'Offline'}
      </Chip>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  chip: {
    elevation: 4,
  },
  chipText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
