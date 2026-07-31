import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    if (!email || !password) return Alert.alert('Missing info', 'Enter both email and password.');
    setSubmitting(true);
    try {
      await login(email, password); // RootNavigator reroutes automatically once `user` is set
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Check your credentials and server URL.';
      Alert.alert('Login failed', msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 justify-center px-6 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text className="text-2xl font-extrabold text-gray-900 text-center">LOGIN PAGE</Text>
      <Text className="text-2xl font-extrabold text-gray-900 text-center">Smart Student System</Text>
      <Text className="text-sm text-gray-500 text-center mt-1.5 mb-8">Sign in to continue</Text>

      <TextInput
        className="bg-white rounded-xl px-3.5 py-3 mb-3.5 border border-gray-200"
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="bg-white rounded-xl px-3.5 py-3 mb-3.5 border border-gray-200"
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity className="bg-brand rounded-xl py-3.5 items-center mt-2" onPress={handleLogin} disabled={submitting}>
        <Text className="text-white font-bold text-base">{submitting ? 'Signing in…' : 'Sign In'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text className="text-brand text-center mt-5 font-semibold">Don't have an account? Register</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
