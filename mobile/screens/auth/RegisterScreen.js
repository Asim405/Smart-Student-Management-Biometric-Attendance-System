import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [role, setRole] = useState('student');
  const [submitting, setSubmitting] = useState(false);

  async function handleRegister() {
    if (!name || !email || !password) return Alert.alert('Missing info', 'Fill in all required fields.');
    setSubmitting(true);
    try {
      await register({ name, email, password, role, student_code: studentCode || undefined });
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed.';
      Alert.alert('Registration failed', msg);
    } finally {
      
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10 bg-gray-50">
      <Text className="text-2xl font-extrabold text-gray-900 text-center mb-6">Create Account</Text>

      <View className="flex-row mb-4 gap-2.5">
        {['student', 'admin'].map((r) => (
          <TouchableOpacity
            key={r}
            className={`flex-1 py-2.5 rounded-xl border items-center ${role === r ? 'bg-brand border-brand' : 'border-gray-200'}`}
            onPress={() => setRole(r)}
          >
            <Text className={`font-semibold ${role === r ? 'text-white' : 'text-gray-700'}`}>
              {r === 'student' ? 'Student' : 'Admin / Teacher'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput className="bg-white rounded-xl px-3.5 py-3 mb-3.5 border border-gray-200" placeholder="Full name" value={name} onChangeText={setName} />
      <TextInput className="bg-white rounded-xl px-3.5 py-3 mb-3.5 border border-gray-200" placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput className="bg-white rounded-xl px-3.5 py-3 mb-3.5 border border-gray-200" placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      {role === 'student' && (
        <TextInput className="bg-white rounded-xl px-3.5 py-3 mb-3.5 border border-gray-200" placeholder="Student ID (optional)" value={studentCode} onChangeText={setStudentCode} />
      )}

      <TouchableOpacity className="bg-brand rounded-xl py-3.5 items-center mt-2" onPress={handleRegister} disabled={submitting}>
        <Text className="text-white font-bold text-base">{submitting ? 'Creating…' : 'Create Account'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text className="text-brand text-center mt-5 font-semibold">Already have an account? Sign in</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
