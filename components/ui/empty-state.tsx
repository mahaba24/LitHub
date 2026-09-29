import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

type Props = {
  icon: ComponentProps<typeof IconSymbol>['name'];
  iconColor: string;
  title: string;
  message: string;
  /** Defaults to a "Browse books" button that opens Home. */
  action?: { label: string; onPress: () => void } | null;
};

/** Centered icon + title + hint + call to action, for empty lists. */
export function EmptyState({ icon, iconColor, title, message, action }: Props) {
  const muted = useThemeColor({}, 'mutedText');
  const cta = action === undefined ? { label: 'Browse books', onPress: () => router.push('/') } : action;

  return (
    <View style={styles.container}>
      <View style={[styles.icon, { backgroundColor: iconColor }]}>
        <IconSymbol name={icon} size={30} color="#fff" />
      </View>
      <ThemedText type="subtitle" style={styles.center}>
        {title}
      </ThemedText>
      <ThemedText style={[styles.message, { color: muted }]}>{message}</ThemedText>
      {cta && <Button label={cta.label} icon="magnifyingglass" onPress={cta.onPress} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  center: { textAlign: 'center' },
  message: { textAlign: 'center', fontSize: 15, lineHeight: 21, marginBottom: 8 },
});
