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
  Chip,
  ActivityIndicator,
  Text,
  IconButton,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { habitService } from '../services/habitService';
import { Habit } from '../database/models/Habit';

export default function HabitDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { habitId } = route.params as { habitId: string };

  const [habit, setHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [completedToday, setCompletedToday] = useState(false);

  useEffect(() => {
    loadHabitDetails();
  }, [habitId]);

  const loadHabitDetails = async () => {
    setLoading(true);
    try {
      const habitData = await habitService.getHabit(habitId);
      const streak = await habitService.calculateHabitStreak(habitId);
      const completed = await habitService.isHabitCompletedToday(habitId);

      setHabit(habitData);
      setCurrentStreak(streak);
      setCompletedToday(completed);
    } catch (error) {
      Alert.alert('Error', 'Failed to load habit details');
      console.error('Error loading habit details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteHabit = async () => {
    try {
      await habitService.completeHabit(habitId);
      setCompletedToday(true);
      setCurrentStreak(await habitService.calculateHabitStreak(habitId));
    } catch (error) {
      Alert.alert('Error', 'Failed to complete habit');
      console.error('Error completing habit:', error);
    }
  };

  const handleUncompleteHabit = async () => {
    try {
      await habitService.uncompleteHabit(habitId);
      setCompletedToday(false);
      setCurrentStreak(await habitService.calculateHabitStreak(habitId));
    } catch (error) {
      Alert.alert('Error', 'Failed to uncomplete habit');
      console.error('Error uncompleting habit:', error);
    }
  };

  const handleDeleteHabit = () => {
    Alert.alert(
      'Delete Habit',
      'Are you sure you want to delete this habit? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await habitService.deleteHabit(habitId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete habit');
              console.error('Error deleting habit:', error);
            }
          },
        },
      ]
    );
  };

  if (loading || !habit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading habit details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.habitCard}>
          <Card.Content>
            <View style={styles.habitHeader}>
              <View style={styles.habitInfo}>
                <Title style={styles.habitName}>{habit.name}</Title>
                {habit.description && (
                  <Paragraph style={styles.habitDescription}>{habit.description}</Paragraph>
                )}
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{currentStreak}</Text>
                <Text style={styles.statLabel}>Current Streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{habit.targetFrequency}</Text>
                <Text style={styles.statLabel}>Target/Week</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{completedToday ? '✓' : '○'}</Text>
                <Text style={styles.statLabel}>Today</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.actionContainer}>
              {completedToday ? (
                <Button
                  mode="contained"
                  icon="check"
                  onPress={handleUncompleteHabit}
                  style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                >
                  Completed Today
                </Button>
              ) : (
                <Button
                  mode="contained"
                  icon="plus"
                  onPress={handleCompleteHabit}
                  style={[styles.actionButton, { backgroundColor: habit.color }]}
                >
                  Complete Today
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.actionsCard}>
          <Card.Content>
            <Title style={styles.actionsTitle}>Actions</Title>
            
            <Button
              mode="outlined"
              icon="pencil"
              onPress={() => {
                // TODO: Navigate to edit screen
                Alert.alert('Coming Soon', 'Edit functionality will be available soon!');
              }}
              style={styles.actionButton}
            >
              Edit Habit
            </Button>

            <Button
              mode="outlined"
              icon="chart-line"
              onPress={() => {
                // TODO: Navigate to analytics screen
                Alert.alert('Coming Soon', 'Analytics will be available soon!');
              }}
              style={styles.actionButton}
            >
              View Analytics
            </Button>

            <Button
              mode="outlined"
              icon="delete"
              onPress={handleDeleteHabit}
              style={[styles.actionButton, styles.deleteButton]}
              textColor="#EF4444"
            >
              Delete Habit
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  habitCard: {
    marginBottom: 16,
    elevation: 2,
  },
  habitHeader: {
    marginBottom: 16,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  habitDescription: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  actionContainer: {
    alignItems: 'center',
  },
  actionButton: {
    marginBottom: 8,
    minWidth: 200,
  },
  actionsCard: {
    elevation: 2,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  deleteButton: {
    borderColor: '#EF4444',
  },
});
