import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

type Props = {
  icon: ComponentProps<typeof IconSymbol>['name'];
  /** Background of the rounded icon tile. */
  iconColor: string;
  label: string;
  /** Muted secondary line under the label. */
  detail?: string;
  /** Red count pill before the chevron; hidden when 0/undefined. */
  badge?: number;
  onPress?: () => void;
};

/** Tappable settings-style row: icon tile · label · badge · chevron. */
export function NavRow({ icon, iconColor, label, detail, badge, onPress }: Props) {
  const muted = useThemeColor({}, 'mutedText');
  const pressedBg = useThemeColor({ light: 'rgba(0,0,0,0.05)', dark: 'rgba(255,255,255,0.06)' }, 'card');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge} pending` : label}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: pressedBg }]}>
      <View style={[styles.iconTile, { backgroundColor: iconColor }]}>
        <IconSymbol name={icon} size={18} color="#fff" />
      </View>
      <View style={styles.text}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        {detail && (
          <ThemedText style={[styles.detail, { color: muted }]} numberOfLines={1}>
            {detail}
          </ThemedText>
        )}
      </View>
      {!!badge && badge > 0 && (
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>{badge > 99 ? '99+' : badge}</ThemedText>
        </View>
      )}
      <IconSymbol name="chevron.right" size={14} color={muted} weight="semibold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  iconTile: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 1 },
  label: { fontSize: 16, lineHeight: 21 },
  detail: { fontSize: 13, lineHeight: 17 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, lineHeight: 16, fontWeight: '700' },
});
