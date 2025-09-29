import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Button, Card, Title, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withObservables } from '@nozbe/with-observables';
import { database, Habit } from '../database/simpleDatabase';

interface TestDatabaseScreenProps {
  habits: Habit[];
}

function TestDatabaseScreen({ habits }: TestDatabaseScreenProps) {
  const [loading, setLoading] = useState(false);

  const createTestHabit = async () => {
    setLoading(true);
    try {
      await database.write(async () => {
        await database.collections.get<Habit>('habits').create((habit) => {
          habit.name = `Test Habit ${Date.now()}`;
          habit.description = 'This is a test habit';
          habit.color = '#3B82F6';
        });
      });
    } catch (error) {
      console.error('Error creating habit:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderHabit = ({ item }: { item: Habit }) => (
    <Card style={styles.habitCard}>
      <Card.Content>
        <Title style={[styles.habitName, { color: item.color }]}>
          {item.name}
        </Title>
        {item.description && (
          <Text style={styles.habitDescription}>{item.description}</Text>
        )}
        <Text style={styles.habitDate}>
          Created: {item.createdAt.toLocaleDateString()}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Database Test</Title>
        <Text style={styles.subtitle}>
          {habits.length} habits in database
        </Text>
      </View>

      <FlatList
        data={habits}
        renderItem={renderHabit}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No habits yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to create a test habit
            </Text>
          </View>
        )}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={createTestHabit}
        loading={loading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  habitCard: {
    marginBottom: 12,
    elevation: 2,
  },
  habitName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  habitDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
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
  habits: database.collections.get<Habit>('habits').query().observe(),
}));

export default enhance(TestDatabaseScreen);
