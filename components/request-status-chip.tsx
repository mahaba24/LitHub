import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { RequestStatus } from '@/types/request';

// Darker text on light cards, lighter text on dark cards; the pill background
// is the same hue at low alpha so it reads as a tint in both themes.
const STATUS_STYLES: Record<RequestStatus, { label: string; light: string; dark: string }> = {
  Requested: { label: 'Requested', light: '#6B7280', dark: '#A1A7AE' },
  'Under Negotiation': { label: 'Negotiating', light: '#C2410C', dark: '#FB923C' },
  Confirmed: { label: 'Confirmed', light: '#2B8A3E', dark: '#4ADE80' },
  Completed: { label: 'Completed', light: '#1D6FD1', dark: '#60A5FA' },
  Overdue: { label: 'Overdue', light: '#D92D20', dark: '#F87171' },
};

/** Small colored pill for a request's status. */
export function RequestStatusChip({ status }: { status: RequestStatus }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const style = STATUS_STYLES[status] ?? { label: status, light: '#6B7280', dark: '#A1A7AE' };
  const color = style[scheme];

  return (
    <View style={[styles.chip, { backgroundColor: `${color}24` }]}>
      <ThemedText style={[styles.text, { color }]} numberOfLines={1}>
        {style.label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  text: { fontSize: 11, lineHeight: 14, fontWeight: '600' },
});
