import React from 'react';
import { View, Text } from 'react-native';

const CONFIG = {
  Top:   { label: '🌟 Top Tier',          bg: 'bg-tierTopBg', fg: 'text-tierTopFg' },
  Mid:   { label: '🔷 Mid Tier',          bg: 'bg-tierMidBg', fg: 'text-tierMidFg' },
  Lower: { label: '⚠️ Needs Attention',   bg: 'bg-tierLowBg', fg: 'text-tierLowFg' },
};

export default function TierBadge({ tier }) {
  const cfg = CONFIG[tier] || CONFIG.mid;
  return (
    <View className={`px-2.5 py-1 rounded-full self-start ${cfg.bg}`}>
      <Text className={`text-xs font-bold ${cfg.fg}`}>{cfg.label}</Text>
    </View>
  );
}


export function tierFromPercentage(pct) {
  if (pct >= 80) return 'top';
  if (pct >= 50) return 'mid';
  return 'lower';
}
