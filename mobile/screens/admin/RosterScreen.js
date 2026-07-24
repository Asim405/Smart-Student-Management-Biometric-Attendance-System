import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import api from '../../services/api';
import TierBadge from '../../components/TierBadge';

export default function RosterScreen() {
  const [courses, setCourses] = useState([]);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [roster, setRoster] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null); // roster row being edited
  const [form, setForm] = useState({ quiz: '', assignment: '', mid: '', final: '' });

  useEffect(() => { loadCourses(); }, []);
  useEffect(() => { if (activeCourseId) loadRoster(activeCourseId); }, [activeCourseId]);

  async function loadCourses() {
    try {
      const { data } = await api.get('/teacher/dashboard');
      setCourses(data.courses);
      if (data.courses[0]) setActiveCourseId(data.courses[0].id);
    } catch (err) {
      console.warn('courses load error', err.message);
    }
  }

  async function loadRoster(courseId) {
    try {
      const { data } = await api.get('/teacher/roster', { params: { course_id: courseId } });
      setRoster(data.roster);
    } catch (err) {
      console.warn('roster load error', err.message);
    }
  }

  function openEditor(student) {
    setEditingStudent(student);
    setForm({
      quiz: String(student.quiz ?? ''),
      assignment: String(student.assignment ?? ''),
      mid: String(student.mid ?? ''),
      final: String(student.final ?? ''),
    });
  }

  async function saveMarks() {
    try {
      await api.post('/teacher/marks', {
        student_id: editingStudent.student_id,
        course_id: activeCourseId,
        quiz: Number(form.quiz) || 0,
        assignment: Number(form.assignment) || 0,
        mid: Number(form.mid) || 0,
        final: Number(form.final) || 0,
      });
      setEditingStudent(null);
      loadRoster(activeCourseId);
    } catch (err) {
      Alert.alert('Save failed', err.response?.data?.error || 'Could not save marks.');
    }
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={courses}
        keyExtractor={(c) => String(c.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 pt-4 grow-0"
        renderItem={({ item }) => (
          <TouchableOpacity
            className={`px-4 py-2 rounded-full mr-2 border ${activeCourseId === item.id ? 'bg-brand border-brand' : 'bg-white border-gray-200'}`}
            onPress={() => setActiveCourseId(item.id)}
          >
            <Text className={`font-semibold ${activeCourseId === item.id ? 'text-white' : 'text-gray-700'}`}>
              {item.course_code}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={roster}
        keyExtractor={(r) => String(r.student_id)}
        contentContainerClassName="p-4"
        ListEmptyComponent={<Text className="text-gray-400 italic mt-3 text-center">No students enrolled in this course yet.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity className="flex-row items-center bg-white rounded-xl p-3.5 mb-2" onPress={() => openEditor(item)}>
            <View className="flex-1">
              <Text className="font-bold text-gray-900">{item.name}</Text>
              <Text className="text-gray-500 text-xs mt-0.5">{item.student_code} · {item.total_percentage ?? '—'}%</Text>
            </View>
            {item.tier && <TierBadge tier={item.tier} />}
          </TouchableOpacity>
        )}
      />

      <Modal visible={!!editingStudent} transparent animationType="slide" onRequestClose={() => setEditingStudent(null)}>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-2xl p-6">
            <Text className="text-lg font-extrabold mb-4">{editingStudent?.name}</Text>
            {['quiz', 'assignment', 'mid', 'final'].map((field) => (
              <View key={field} className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-700 font-semibold">{field[0].toUpperCase() + field.slice(1)}</Text>
                <TextInput
                  className="border border-gray-200 rounded-lg px-3 py-2 w-[100px] text-right"
                  keyboardType="numeric"
                  value={form[field]}
                  onChangeText={(v) => setForm({ ...form, [field]: v })}
                />
              </View>
            ))}
            <View className="flex-row mt-3 gap-2.5">
              <TouchableOpacity className="flex-1 py-3 items-center rounded-xl bg-gray-100" onPress={() => setEditingStudent(null)}>
                <Text className="text-gray-700 font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 py-3 items-center rounded-xl bg-brand" onPress={saveMarks}>
                <Text className="text-white font-bold">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
