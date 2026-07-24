import React, { useEffect, useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, Alert } from 'react-native';
import api from '../../services/api';
import TierBadge, { tierFromPercentage } from '../../components/TierBadge';

export default function TierAnalyticsScreen() {
  const [sections, setSections] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data } = await api.get('/teacher/dashboard');
      const allRoster = [];
      for (const c of data.courses) {
        const r = await api.get('/teacher/roster', { params: { course_id: c.id } });
        r.data.roster.forEach((s) => allRoster.push({ ...s, course: c.course_code }));
      }
      const groups = { top: [], mid: [], lower: [] };
      allRoster.forEach((s) => {
        if (s.total_percentage == null) return;
        groups[tierFromPercentage(Number(s.total_percentage))].push(s);
      });
      setSections([
        { title: 'top', label: '🌟 Top Tier (≥ 80%)', data: groups.top },
        { title: 'mid', label: '🔷 Mid Tier (50–79%)', data: groups.mid },
        { title: 'lower', label: '⚠️ Needs Attention (< 50%)', data: groups.lower },
      ]);
    } catch (err) {
      console.warn('tier analytics load error', err.message);
    }
  }

  function notifyStudent(name) {
    // Hook this up to a real notification/email endpoint when you add one —
    // stubbed here since it's outside the scope of the current API surface.
    Alert.alert('Flagged', `${name} has been flagged for follow-up.`);
  }

  return (
    <SectionList
      className="flex-1 bg-gray-50 p-4"
      sections={sections}
      keyExtractor={(item, i) => `${item.student_id}-${i}`}
      renderSectionHeader={({ section }) => (
        <Text className="text-sm font-extrabold text-gray-900 mt-4 mb-2">{section.label} · {section.data.length}</Text>
      )}
      renderItem={({ item, section }) => (
        <View className="flex-row items-center bg-white rounded-xl p-3 mb-2">
          <View className="flex-1">
            <Text className="font-bold text-gray-900">{item.name}</Text>
            <Text className="text-gray-500 text-xs mt-0.5">{item.course} · {item.total_percentage}%</Text>
          </View>
          {section.title === 'lower' ? (
            <TouchableOpacity className="bg-tierLowBg px-3 py-1.5 rounded-lg" onPress={() => notifyStudent(item.name)}>
              <Text className="text-tierLowFg font-bold text-xs">Flag</Text>
            </TouchableOpacity>
          ) : (
            <TierBadge tier={section.title} />
          )}
        </View>
      )}
      ListEmptyComponent={<Text className="text-gray-400 italic mt-5 text-center">No marks recorded yet.</Text>}
    />
  );
}
