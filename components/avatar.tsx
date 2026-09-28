import { StyleSheet, Text, View } from 'react-native';

import { ACCENT_COLOR } from '@/constants/theme';
import { avatarColorFor } from '@/lib/avatar-color';

function initialsOf(name: string | null | undefined) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}

type Props = {
  name: string | null | undefined;
  /** Picks the circle's color deterministically, so a user looks the same everywhere. */
  uid?: string | null;
  size?: number;
};

/** Initials on a solid circle — no photo uploads (Storage needs the Blaze plan). */
export function Avatar({ name, uid, size = 44 }: Props) {
  const color = uid ? avatarColorFor(uid) : ACCENT_COLOR;
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]} numberOfLines={1}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontWeight: '700', letterSpacing: 0.5 },
});
