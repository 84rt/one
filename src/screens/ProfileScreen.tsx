import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  List,
  Divider,
  ActivityIndicator,
  Text,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../services/authService';
import { syncService } from '../services/syncService';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const user = authService.getCurrentUser();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await authService.signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
              console.error('Error signing out:', error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSync = async () => {
    if (!syncService.isOnlineStatus) {
      Alert.alert('Offline', 'You need to be online to sync your data');
      return;
    }

    setSyncing(true);
    try {
      const result = await syncService.sync();
      if (result.success) {
        Alert.alert('Success', `Synced ${result.syncedRecords} records successfully`);
      } else {
        Alert.alert('Sync Failed', result.errors.join('\n'));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to sync data');
      console.error('Error syncing:', error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.profileCard}>
          <Card.Content>
            <Title style={styles.profileTitle}>Profile</Title>
            
            <View style={styles.userInfo}>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <Text style={styles.userId}>ID: {user?.id}</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.settingsCard}>
          <Card.Content>
            <Title style={styles.settingsTitle}>Settings</Title>
            
            <List.Item
              title="Sync Status"
              description={syncService.isOnlineStatus ? 'Online' : 'Offline'}
              left={(props) => (
                <List.Icon 
                  {...props} 
                  icon={syncService.isOnlineStatus ? 'wifi' : 'wifi-off'} 
                  color={syncService.isOnlineStatus ? '#4CAF50' : '#EF4444'}
                />
              )}
              right={(props) => (
                <Button
                  mode="outlined"
                  onPress={handleSync}
                  loading={syncing}
                  disabled={!syncService.isOnlineStatus || syncing}
                  compact
                >
                  Sync
                </Button>
              )}
            />

            <Divider />

            <List.Item
              title="Notifications"
              description="Manage your notification preferences"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available soon!')}
            />

            <Divider />

            <List.Item
              title="Privacy"
              description="Control your data and privacy settings"
              left={(props) => <List.Icon {...props} icon="shield" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Coming Soon', 'Privacy settings will be available soon!')}
            />

            <Divider />

            <List.Item
              title="Help & Support"
              description="Get help and contact support"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Coming Soon', 'Help & support will be available soon!')}
            />
          </Card.Content>
        </Card>

        <Card style={styles.aboutCard}>
          <Card.Content>
            <Title style={styles.aboutTitle}>About</Title>
            
            <Paragraph style={styles.aboutText}>
              Habit Tracker helps you build better habits with offline-first functionality 
              and social accountability features.
            </Paragraph>
            
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleSignOut}
          style={styles.signOutButton}
          loading={loading}
          disabled={loading}
        >
          Sign Out
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileCard: {
    marginBottom: 16,
    elevation: 2,
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  userInfo: {
    alignItems: 'center',
  },
  userEmail: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userId: {
    fontSize: 12,
    color: '#666',
  },
  settingsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  aboutCard: {
    marginBottom: 24,
    elevation: 2,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
  signOutButton: {
    backgroundColor: '#EF4444',
  },
});
