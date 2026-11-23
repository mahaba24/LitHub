import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { CardSeparator } from '@/components/ui/card';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/auth-context';
import { useFollowers, useFollowing } from '@/hooks/use-follows';
import { useThemeColor } from '@/hooks/use-theme-color';

type Tab = 'followers' | 'following';

/** Followers / Following lists for any user, as two tabs. */
export default function ConnectionsScreen() {
  const { id, tab: initialTab } = useLocalSearchParams<{ id: string; tab?: Tab }>();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>(initialTab === 'followers' ? 'followers' : 'following');
  const followers = useFollowers(id);
  const following = useFollowing(id);
  const background = useThemeColor({}, 'groupedBackground');
  const card = useThemeColor({}, 'card');
  const muted = useThemeColor({}, 'mutedText');

  const isMe = id === user?.uid;
  // Each row shows the *other* side of the relationship.
  const people =
    tab === 'followers'
      ? followers.follows.map((f) => ({ uid: f.followerId, name: f.followerName }))
      : following.follows.map((f) => ({ uid: f.followeeId, name: f.followeeName }));
  const loading = tab === 'followers' ? followers.loading : following.loading;

  const emptyText =
    tab === 'followers'
      ? 'No followers yet.'
      : isMe
        ? 'You’re not following anyone yet. Follow readers from their profile to see their new books on Home.'
        : 'Not following anyone yet.';

  return (
    <>
      <Stack.Screen options={{ title: isMe ? 'Your Connections' : 'Connections' }} />
      <FlatList
        style={{ backgroundColor: background }}
        contentContainerStyle={styles.content}
        data={people}
        keyExtractor={(item) => item.uid}
        ListHeaderComponent={
          <View style={styles.segmented}>
            <SegmentedControl<Tab>
              options={[
                { value: 'followers', label: `Followers (${followers.follows.length})` },
                { value: 'following', label: `Following (${following.follows.length})` },
              ]}
              value={tab}
              onChange={setTab}
            />
          </View>
        }
        ListEmptyComponent={
          !loading ? <ThemedText style={[styles.empty, { color: muted }]}>{emptyText}</ThemedText> : null
        }
        renderItem={({ item, index }) => (
          <View
            style={[
              { backgroundColor: card },
              index === 0 && styles.first,
              index === people.length - 1 && styles.last,
            ]}>
            {index > 0 && <CardSeparator inset={72} />}
            <Pressable
              onPress={() => router.push(`/user/${item.uid}`)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <Avatar name={item.name} uid={item.uid} size={44} />
              <ThemedText style={styles.name} numberOfLines={1}>
                {item.name}
              </ThemedText>
              <IconSymbol name="chevron.right" size={14} color={muted} />
            </Pressable>
          </View>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  segmented: { marginBottom: 16 },
  first: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  last: { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 10 },
  pressed: { opacity: 0.6 },
  name: { flex: 1, fontSize: 16, fontWeight: '500' },
  empty: { textAlign: 'center', marginTop: 24, paddingHorizontal: 16, lineHeight: 21 },
});
