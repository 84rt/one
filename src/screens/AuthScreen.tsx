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
  Paragraph,
  Switch,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService, SignUpData, SignInData } from '../services/authService';

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    if (isSignUp) {
      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return false;
      }

      if (formData.password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return false;
      }
    }

    return true;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const signInData: SignInData = {
        email: formData.email,
        password: formData.password,
      };

      const { user, error } = await authService.signIn(signInData);

      if (error) {
        Alert.alert('Sign In Failed', error.message);
      } else if (user) {
        // User will be automatically redirected by the auth state change
        console.log('User signed in successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const signUpData: SignUpData = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
      };

      const { user, error } = await authService.signUp(signUpData);

      if (error) {
        Alert.alert('Sign Up Failed', error.message);
      } else if (user) {
        Alert.alert(
          'Success',
          'Account created successfully! Please check your email to verify your account.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }

    try {
      const { error } = await authService.resetPassword(formData.email);
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Password Reset',
          'Check your email for password reset instructions'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
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
              <Title style={styles.title}>
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </Title>
              <Paragraph style={styles.subtitle}>
                {isSignUp
                  ? 'Start building better habits today'
                  : 'Sign in to continue your habit journey'}
              </Paragraph>

              {isSignUp && (
                <TextInput
                  label="Full Name"
                  value={formData.fullName}
                  onChangeText={(value) => handleInputChange('fullName', value)}
                  mode="outlined"
                  style={styles.input}
                  autoCapitalize="words"
                />
              )}

              <TextInput
                label="Email"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                label="Password"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                mode="outlined"
                style={styles.input}
                secureTextEntry
                autoCapitalize="none"
              />

              {isSignUp && (
                <TextInput
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  mode="outlined"
                  style={styles.input}
                  secureTextEntry
                  autoCapitalize="none"
                />
              )}

              <Button
                mode="contained"
                onPress={isSignUp ? handleSignUp : handleSignIn}
                style={styles.button}
                disabled={loading}
                loading={loading}
              >
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Button>

              {!isSignUp && (
                <Button
                  mode="text"
                  onPress={handleForgotPassword}
                  style={styles.forgotButton}
                >
                  Forgot Password?
                </Button>
              )}

              <View style={styles.switchContainer}>
                <Paragraph>
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                </Paragraph>
                <Button
                  mode="text"
                  onPress={() => setIsSignUp(!isSignUp)}
                  compact
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Button>
              </View>
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
  forgotButton: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
});
