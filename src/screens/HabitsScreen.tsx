import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  FAB,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  ActivityIndicator,
  Text,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { withObservables } from '@nozbe/with-observables';
import { database } from '../database';
import { Habit } from '../database/models/Habit';
import { habitService, HabitWithStreak } from '../services/habitService';
import { syncService } from '../services/syncService';

interface HabitsScreenProps {
  habits: Habit[];
}

function HabitsScreen({ habits }: HabitsScreenProps) {
  const navigation = useNavigation();
  const [habitsWithStreaks, setHabitsWithStreaks] = useState<HabitWithStreak[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHabitsWithStreaks();
  }, [habits]);

  const loadHabitsWithStreaks = async () => {
    setLoading(true);
    try {
      const habitsWithStreaksData = await habitService.getHabitsWithStreaks();
      setHabitsWithStreaks(habitsWithStreaksData);
    } catch (error) {
      console.error('Error loading habits with streaks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadHabitsWithStreaks();
      // Trigger sync if online
      if (syncService.isOnlineStatus) {
        await syncService.sync();
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCompleteHabit = async (habitId: string) => {
    try {
      await habitService.completeHabit(habitId);
      await loadHabitsWithStreaks();
    } catch (error) {
      console.error('Error completing habit:', error);
    }
  };

  const handleUncompleteHabit = async (habitId: string) => {
    try {
      await habitService.uncompleteHabit(habitId);
      await loadHabitsWithStreaks();
    } catch (error) {
      console.error('Error uncompleting habit:', error);
    }
  };

  const renderHabit = ({ item }: { item: HabitWithStreak }) => (
    <Card style={styles.habitCard}>
      <Card.Content>
        <View style={styles.habitHeader}>
          <View style={styles.habitInfo}>
            <Title style={styles.habitName}>{item.name}</Title>
            {item.description && (
              <Paragraph style={styles.habitDescription}>{item.description}</Paragraph>
            )}
          </View>
          <IconButton
            icon="chevron-right"
            size={20}
            onPress={() => navigation.navigate('HabitDetail', { habitId: item.id })}
          />
        </View>

        <View style={styles.habitStats}>
          <Chip
            icon="fire"
            style={[styles.chip, { backgroundColor: item.color + '20' }]}
            textStyle={{ color: item.color }}
          >
            {item.currentStreak} day streak
          </Chip>
          <Chip
            icon="chart-line"
            style={styles.chip}
          >
            {Math.round(item.completionRate)}% this month
          </Chip>
        </View>

        <View style={styles.habitActions}>
          {item.completedToday ? (
            <Button
              mode="contained"
              icon="check"
              onPress={() => handleUncompleteHabit(item.id)}
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
            >
              Completed Today
            </Button>
          ) : (
            <Button
              mode="contained"
              icon="plus"
              onPress={() => handleCompleteHabit(item.id)}
              style={[styles.actionButton, { backgroundColor: item.color }]}
            >
              Complete Today
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No habits yet</Text>
      <Paragraph style={styles.emptyStateDescription}>
        Start building better habits by creating your first one!
      </Paragraph>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('CreateHabit')}
        style={styles.emptyStateButton}
      >
        Create Your First Habit
      </Button>
    </View>
  );

  if (loading && habitsWithStreaks.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading habits...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={habitsWithStreaks}
        renderItem={renderHabit}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />
      
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateHabit')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  habitCard: {
    marginBottom: 16,
    elevation: 2,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 14,
    color: '#666',
  },
  habitStats: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: '#e0e0e0',
  },
  habitActions: {
    alignItems: 'center',
  },
  actionButton: {
    minWidth: 200,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    minWidth: 200,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

// Connect to WatermelonDB
const enhance = withObservables([], () => ({
  habits: database.collections.get<Habit>('habits').query().where('deleted_at', null).observe(),
}));

export default enhance(HabitsScreen);
