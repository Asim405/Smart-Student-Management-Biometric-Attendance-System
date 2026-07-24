import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart } from 'react-native-chart-kit';
import api from '../../services/api';
import { connectSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

const screenWidth = Dimensions.get('window').width - 32;

export default function PerformanceTrackerScreen() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);       // enrolled courses
  const [attendance, setAttendance] = useState({});  // course_id -> { percentage, below_threshold }

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/student/courses');
      const enrolled = data.courses.filter((c) => c.is_enrolled);
      setCourses(enrolled);

      const results = {};
      for (const c of enrolled) {
        const res = await api.get(`/student/attendance/${c.id}`);
        results[c.id] = res.data;
      }
      setAttendance(results);
    } catch (err) {
      console.warn('performance load error', err.message);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Live-refresh attendance the instant this student's own fingerprint
  // is scanned, without waiting for a manual pull-to-refresh.
  useEffect(() => {
    const socket = connectSocket();
    const handler = (payload) => {
      if (payload.student.id === user.id) load();
    };
    socket.on('attendance:new', handler);
    return () => socket.off('attendance:new', handler);
  }, [user, load]);

  const chartData = {
    labels: courses.map((c) => c.course_code),
    datasets: [{ data: courses.map((c) => Number(attendance[c.id]?.percentage ?? 0)) }],
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      {courses.length > 0 && (
        <>
          <Text className="text-base font-bold text-gray-900 mb-2.5 mt-1.5">Attendance by Subject</Text>
          <BarChart
            data={chartData}
            width={screenWidth}
            height={220}
            fromZero
            yAxisSuffix="%"
            chartConfig={{
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
              labelColor: () => '#6B7280',
            }}
            style={{ borderRadius: 12 }}
          />
        </>
      )}

      <Text className="text-base font-bold text-gray-900 mb-2.5 mt-1.5">Subject-wise Health</Text>
      {courses.map((c) => {
        const att = attendance[c.id];
        const pct = att?.percentage ?? 0;
        return (
          <View key={c.id} className="bg-white rounded-xl p-3.5 mb-2.5">
            <View className="flex-row justify-between mb-2">
              <Text className="font-bold text-gray-900 flex-1">{c.course_code} — {c.title}</Text>
              <Text className={`font-extrabold ${att?.below_threshold ? 'text-red-500' : 'text-tierTopFg'}`}>{pct}%</Text>
            </View>
            <View className="h-2 bg-gray-200 rounded overflow-hidden">
              <View
                className={`h-2 rounded ${att?.below_threshold ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </View>
            {att?.below_threshold && (
              <Text className="text-red-500 text-xs mt-1.5 font-semibold">⚠️ Below 75% attendance threshold</Text>
            )}
          </View>
        );
      })}
      {courses.length === 0 && <Text className="text-gray-400 italic mt-5 text-center">Enroll in a course to see your performance here.</Text>}
    </ScrollView>
  );
}
