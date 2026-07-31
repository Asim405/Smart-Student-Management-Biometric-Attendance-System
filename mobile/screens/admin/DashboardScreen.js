import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import { useAuth } from '../../context/AuthContext';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/teacher/dashboard');
      setData(data);
    } catch (err) {
      console.warn('dashboard load error', err.message);
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
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}</Text>
        <TouchableOpacity onPress={logout}><Text className="text-red-500 font-semibold">Log out</Text></TouchableOpacity>
      </View>

      <View className="flex-row -mx-1 mb-3">
        <StatCard label="Students" value={data?.total_students ?? '—'} />
        <StatCard label="Class Avg" value={data ? `${data.class_average}%` : '—'} accent="#0EA5E9" />
        <StatCard label="Courses" value={data?.courses?.length ?? '—'} accent="#F59E0B" />
      </View>

      <Text className="text-base font-bold text-gray-900 mt-5 mb-2.5">Biometric Stations</Text>
      {data?.devices?.length ? data.devices.map((d) => (
        <View key={d.id} className="flex-row items-center bg-white rounded-xl p-3 mb-2">
          <View className={`w-2.5 h-2.5 rounded-full mr-2.5 ${d.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} />
          <Text className="flex-1 font-semibold text-gray-700">{d.room_label || `Device #${d.id}`}</Text>
          <Text className="text-gray-500 text-xs">{d.status === 'online' ? 'Online' : 'Offline'}</Text>
        </View>
      )) : <Text className="text-gray-400 italic">No devices assigned to your courses yet.</Text>}

      <Text className="text-base font-bold text-gray-900 mt-5 mb-2.5">Tier Distribution</Text>
      <View className="flex-row -mx-1">
        <StatCard label="🌟 Top" value={data?.tier_distribution?.top ?? 0} accent="#15803D" />
        <StatCard label="🔷 Mid" value={data?.tier_distribution?.mid ?? 0} accent="#3660d4" />
        <StatCard label="⚠️ Lower" value={data?.tier_distribution?.lower ?? 0} accent="#B91C1C" />
      </View>

      <Text className="text-base font-bold text-gray-900 mt-5 mb-2.5">Your  Courses</Text>
      {data?.courses?.map((c) => (
        <View key={c.id} className="bg-white rounded-xl p-3 mb-2">
          <Text className="font-bold text-gray-900">{c.course_code} — {c.title}</Text>
          <Text className="text-gray-500 text-xs mt-0.5">{c.enrolled_count}/{c.seat_limit} enrolled</Text>
        </View>
      ))}
    </ScrollView>
  );
}
