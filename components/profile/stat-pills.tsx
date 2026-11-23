import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

export type Stat = {
  icon: ComponentProps<typeof IconSymbol>['name'];
  color: string;
  value: string | number;
  label: string;
};

/** 2×2 grid of stat cards: tinted icon, big number, small label. */
export function StatPills({ stats }: { stats: Stat[] }) {
  const card = useThemeColor({}, 'card');
  const muted = useThemeColor({}, 'mutedText');

  return (
    <View style={styles.grid}>
      {stats.map((stat) => (
        <View key={stat.label} style={[styles.pill, { backgroundColor: card }]}>
          <View style={[styles.iconBubble, { backgroundColor: `${stat.color}22` }]}>
            <IconSymbol name={stat.icon} size={16} color={stat.color} />
          </View>
          <View style={styles.text}>
            <ThemedText style={styles.value} numberOfLines={1}>
              {stat.value}
            </ThemedText>
            <ThemedText style={[styles.label, { color: muted }]} numberOfLines={1}>
              {stat.label}
            </ThemedText>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    flexGrow: 1,
    flexBasis: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
  },
  iconBubble: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  value: { fontSize: 20, lineHeight: 24, fontWeight: '700' },
  label: { fontSize: 12, lineHeight: 16 },
});
