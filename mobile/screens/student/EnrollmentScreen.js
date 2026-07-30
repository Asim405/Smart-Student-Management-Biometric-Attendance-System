import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';

export default function EnrollmentScreen() {
  const [courses, setCourses] = useState([]);
  const [enrollingId, setEnrollingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/student/courses');
      setCourses(data.courses);
    } catch (err) {
      console.warn('courses load error', err.message);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleEnroll(course) {
    setEnrollingId(course.id);
    try {
      await api.post('/student/enroll', { course_id: course.id });
      load();
    } catch (err) {
      Alert.alert('Enrollment failed', err.response?.data?.error || 'Could not enroll.');

    } finally {
      setEnrollingId(null);
    }
  }

  return (
    <FlatList
      className="flex-1 bg-gray-50"
      data={courses}
      keyExtractor={(c) => String(c.id)}
      contentContainerClassName="p-4"
      renderItem={({ item }) => {
        const full = item.enrolled_count >= item.seat_limit;
        return (
          <View className="flex-row items-center bg-white rounded-2xl p-3.5 mb-2.5">
            <View className="flex-1">
              <Text className="font-bold text-gray-900">{item.course_code} — {item.title}</Text>
              <Text className="text-gray-500 text-xs mt-1">{item.credit_hours} credit hrs · {item.enrolled_count}/{item.seat_limit} seats</Text>
            </View>
            <TouchableOpacity
              className={`px-3.5 py-2.5 rounded-lg ${(item.is_enrolled || full) ? 'bg-gray-300' : 'bg-brand'}`}
              disabled={item.is_enrolled || full || enrollingId === item.id}
              onPress={() => handleEnroll(item)}
            >
              <Text className="text-white font-bold text-xs">
                {item.is_enrolled ? 'Enrolled' : full ? 'Full' : enrollingId === item.id ? '…' : 'Enroll Now'}
                
              </Text>
            </TouchableOpacity>
          </View>
        );
      }}
    />
  );
}
