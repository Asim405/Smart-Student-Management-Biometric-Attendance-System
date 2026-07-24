import React from 'react';
import { View, Text } from 'react-native';

const ACCENT_TEXT = {
  '#4F46E5': 'text-brand', '#0EA5E9': 'text-brandSky', '#F59E0B': 'text-brandAmber',
  '#15803D': 'text-tierTopFg', '#1D4ED8': 'text-tierMidFg', '#B91C1C': 'text-tierLowFg',
};

export default function StatCard({ label, value, accent = '#4F46E5' }) {
  const accentClass = ACCENT_TEXT[accent] || 'text-brand';
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 mx-1 shadow-sm">
      <Text className={`text-2xl font-extrabold ${accentClass}`}>{value}</Text>
      <Text className="text-xs text-gray-500 mt-1">{label}</Text>
    </View>
  );
}
