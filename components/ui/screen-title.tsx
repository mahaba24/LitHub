import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ACCENT_COLOR } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type Props = {
  title: string;
  subtitle?: string;
  /** Round accent button on the right (e.g. "+" to add a book). */
  action?: { icon: ComponentProps<typeof IconSymbol>['name']; label: string; onPress: () => void };
};

/** Large-title header for tab screens (no native header is shown on tabs). */
export function ScreenTitle({ title, subtitle, action }: Props) {
  const muted = useThemeColor({}, 'mutedText');

  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
        {subtitle ? <ThemedText style={[styles.subtitle, { color: muted }]}>{subtitle}</ThemedText> : null}
      </View>
      {action && (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          hitSlop={8}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <IconSymbol name={action.icon} size={22} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  text: { flex: 1 },
  title: { fontSize: 32, lineHeight: 38 },
  subtitle: { fontSize: 15, lineHeight: 20, marginTop: 2 },
  action: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: ACCENT_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
