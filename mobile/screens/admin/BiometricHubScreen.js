import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import api from '../../services/api';
import { connectSocket } from '../../services/socket';

export default function BiometricHubScreen() {
  const [devices, setDevices] = useState([]);
  const [liveScans, setLiveScans] = useState([]);

  useEffect(() => {
    loadDevices();

    // Live connectivity + attendance feed. The ESP32 hitting
    
    // /api/attendance/mark-biometric triggers the server to emit
    // 'attendance:new', which every connected mobile client receives here.
    const socket = connectSocket();
    socket.on('attendance:new', (payload) => {
      setLiveScans((prev) => [payload, ...prev].slice(0, 25));
      setDevices((prev) =>
        prev.map((d) => (d.id === payload.device_id ? { ...d, status: 'online' } : d))
      );
    });

    return () => socket.off('attendance:new');
  }, []);

  async function loadDevices() {
    try {
      const { data } = await api.get('/attendance/devices');
      setDevices(data.devices);
    } catch (err) {
      console.warn('device load error', err.message);
    }
  }

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-base font-bold text-gray-900 mb-2.5 mt-1.5">Station Status</Text>
      <FlatList
        data={devices}
        keyExtractor={(d) => String(d.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="pb-2"
        renderItem={({ item }) => (
          <View className="bg-white rounded-xl p-3.5 mr-2.5 min-w-[130px]">
            <View className={`w-2.5 h-2.5 rounded-full mb-2 ${item.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} />
            <Text className="font-bold text-gray-900">{item.room_label}</Text>
            <Text className="text-gray-500 text-xs mt-0.5">{item.status === 'online' ? 'Online' : 'Offline'}</Text>
          </View>
        )}
      />

      <Text className="text-base font-bold text-gray-900 mb-2.5 mt-1.5">Live Attendance Feed</Text>
      <FlatList
        data={liveScans}
        keyExtractor={(_, i) => String(i)}
        ListEmptyComponent={<Text className="text-gray-400 italic mt-2">Waiting for fingerprint scans…</Text>}
        renderItem={({ item }) => (
          <View className="bg-white rounded-xl p-3 mb-2">
            <Text className="font-bold text-gray-900">{item.student.name}</Text>
            <Text className="text-gray-500 text-xs mt-0.5">{item.room_label} · {new Date(item.scanned_at).toLocaleTimeString()}</Text>
          </View>
        )}
      />
    </View>
  );
}
