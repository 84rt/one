import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  SegmentedButtons,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { habitService } from '../services/habitService';

const HABIT_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

const HABIT_ICONS = [
  'check-circle',
  'heart',
  'book',
  'dumbbell',
  'water',
  'moon',
  'sun',
  'leaf',
  'coffee',
  'phone',
  'laptop',
  'car',
  'home',
  'work',
  'school',
  'star',
];

const FREQUENCY_OPTIONS = [
  { value: '1', label: 'Daily' },
  { value: '3', label: '3x/week' },
  { value: '5', label: '5x/week' },
  { value: '7', label: 'Every day' },
];

export default function CreateHabitScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: HABIT_COLORS[0],
    icon: HABIT_ICONS[0],
    targetFrequency: 7,
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return false;
    }

    if (formData.name.length > 50) {
      Alert.alert('Error', 'Habit name must be less than 50 characters');
      return false;
    }

    return true;
  };

  const handleCreateHabit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await habitService.createHabit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
        icon: formData.icon,
        targetFrequency: formData.targetFrequency,
      });

      Alert.alert(
        'Success',
        'Habit created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create habit. Please try again.');
      console.error('Error creating habit:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.title}>Create New Habit</Title>

              <TextInput
                label="Habit Name *"
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                mode="outlined"
                style={styles.input}
                placeholder="e.g., Drink 8 glasses of water"
                maxLength={50}
              />

              <TextInput
                label="Description (Optional)"
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                mode="outlined"
                style={styles.input}
                placeholder="Add a description to help you remember why this habit matters"
                multiline
                numberOfLines={3}
                maxLength={200}
              />

              <View style={styles.section}>
                <Title style={styles.sectionTitle}>Target Frequency</Title>
                <SegmentedButtons
                  value={formData.targetFrequency.toString()}
                  onValueChange={(value) => handleInputChange('targetFrequency', parseInt(value))}
                  buttons={FREQUENCY_OPTIONS}
                  style={styles.segmentedButtons}
                />
              </View>

              <View style={styles.section}>
                <Title style={styles.sectionTitle}>Color</Title>
                <View style={styles.colorContainer}>
                  {HABIT_COLORS.map((color) => (
                    <Chip
                      key={color}
                      selected={formData.color === color}
                      onPress={() => handleInputChange('color', color)}
                      style={[
                        styles.colorChip,
                        { backgroundColor: color + '20' },
                        formData.color === color && { backgroundColor: color },
                      ]}
                      textStyle={{
                        color: formData.color === color ? 'white' : color,
                        fontWeight: formData.color === color ? 'bold' : 'normal',
                      }}
                    >
                      {color === formData.color ? '✓' : ''}
                    </Chip>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Title style={styles.sectionTitle}>Icon</Title>
                <View style={styles.iconContainer}>
                  {HABIT_ICONS.map((icon) => (
                    <Chip
                      key={icon}
                      selected={formData.icon === icon}
                      onPress={() => handleInputChange('icon', icon)}
                      style={[
                        styles.iconChip,
                        formData.icon === icon && { backgroundColor: formData.color },
                      ]}
                      textStyle={{
                        color: formData.icon === icon ? 'white' : '#666',
                        fontWeight: formData.icon === icon ? 'bold' : 'normal',
                      }}
                    >
                      {icon}
                    </Chip>
                  ))}
                </View>
              </View>

              <Button
                mode="contained"
                onPress={handleCreateHabit}
                style={[styles.createButton, { backgroundColor: formData.color }]}
                disabled={loading}
                loading={loading}
              >
                Create Habit
              </Button>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 24,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  iconContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconChip: {
    marginBottom: 8,
  },
  createButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
});
