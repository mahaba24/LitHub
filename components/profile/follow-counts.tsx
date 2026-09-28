import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useFollowers, useFollowing } from '@/hooks/use-follows';
import { useThemeColor } from '@/hooks/use-theme-color';

/** "12 Followers · 8 Following" — each half opens that tab of the connections list. */
export function FollowCounts({ uid }: { uid: string }) {
  const { follows: followers } = useFollowers(uid);
  const { follows: following } = useFollowing(uid);
  const muted = useThemeColor({}, 'mutedText');
  const separator = useThemeColor({}, 'separator');

  const open = (tab: 'followers' | 'following') =>
    router.push({ pathname: '/connections/[id]', params: { id: uid, tab } });

  return (
    <View style={styles.row}>
      <Pressable onPress={() => open('followers')} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
        <ThemedText style={styles.count}>{followers.length}</ThemedText>
        <ThemedText style={[styles.label, { color: muted }]}>
          {followers.length === 1 ? 'Follower' : 'Followers'}
        </ThemedText>
      </Pressable>
      <View style={[styles.divider, { backgroundColor: separator }]} />
      <Pressable onPress={() => open('following')} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
        <ThemedText style={styles.count}>{following.length}</ThemedText>
        <ThemedText style={[styles.label, { color: muted }]}>Following</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 8 },
  item: { alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4 },
  pressed: { opacity: 0.5 },
  count: { fontSize: 18, lineHeight: 22, fontWeight: '700' },
  label: { fontSize: 13, lineHeight: 17 },
  divider: { width: StyleSheet.hairlineWidth, height: 28 },
});
