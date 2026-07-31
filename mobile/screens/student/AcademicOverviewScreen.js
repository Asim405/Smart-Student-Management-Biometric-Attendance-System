import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import { useAuth } from '../../context/AuthContext';

export default function AcademicOverviewScreen() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/student/profile');
      setProfile(data);
    } catch (err) {
      console.warn('profile load error', err.message);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50 p-4"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="flex-row justify-between items-center mb-5">
        <View>
          <Text className="text-xl font-extrabold text-gray-900">{profile?.name || '—'}</Text>
          <Text className="text-gray-500 mt-0.5">{profile?.student_code || '—'}</Text>
        </View>
        <TouchableOpacity onPress={logout}><Text className="text-red-500 font-semibold">Log out</Text></TouchableOpacity>
      </View>

      <View className="flex-row -mx-1 mb-2">
        <StatCard label="CGPA" value={profile?.cgpa ?? '—'} accent="#5a53e6" />
        <StatCard label="Current SGPA" value={profile?.sgpa ?? '—'} accent="#24adec" />
      </View>
      <View className="flex-row -mx-1 mb-2">
        <StatCard label="Earned Credits" value={profile?.earned_credits ?? '—'} accent="#15803D" />
        <StatCard label="Remaining Credits" value={profile?.remaining_credits ?? '—'} accent="#F59E0B" />
      </View>
    </ScrollView>
  );
}
