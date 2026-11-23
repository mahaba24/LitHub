import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { Card, CardSeparator } from '@/components/ui/card';
import { useBlockActions, useBlockedUsers, type BlockedUser } from '@/hooks/use-blocks';
import { useThemeColor } from '@/hooks/use-theme-color';
import { confirm, notify } from '@/lib/confirm';

/** Account › Blocked users: everyone I've blocked, with Unblock buttons. */
export default function BlockedUsersScreen() {
  const { users, loading } = useBlockedUsers();
  const { status, unblock } = useBlockActions();
  const background = useThemeColor({}, 'groupedBackground');
  const muted = useThemeColor({}, 'mutedText');
  const busy = status === 'submitting';

  const handleUnblock = async (target: BlockedUser) => {
    const ok = await confirm({
      title: `Unblock ${target.displayName}?`,
      message:
        'You’ll be able to send each other requests and messages again, and you’ll see their books. You won’t automatically follow them again.',
      confirmLabel: 'Unblock',
    });
    if (!ok) return;
    try {
      await unblock(target.uid);
    } catch (error) {
      console.warn('unblock failed', error);
      notify('Couldn’t unblock', 'Something went wrong. Check your connection and try again.');
    }
  };

  return (
    <ScrollView style={{ backgroundColor: background }} contentContainerStyle={styles.content}>
      <Card
        title="Blocked users"
        footer="Blocked people can’t send you borrow requests or messages, and you can’t contact them. They aren’t told you blocked them.">
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator />
          </View>
        ) : users.length === 0 ? (
          <ThemedText style={[styles.empty, { color: muted }]}>You haven’t blocked anyone.</ThemedText>
        ) : (
          users.map((target, index) => (
            <View key={target.uid}>
              {index > 0 && <CardSeparator inset={70} />}
              <View style={styles.row}>
                <Pressable
                  onPress={() => router.push(`/user/${target.uid}`)}
                  style={({ pressed }) => [styles.person, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${target.displayName}'s profile`}>
                  <Avatar name={target.displayName} uid={target.uid} size={40} />
                  <ThemedText style={styles.name} numberOfLines={1}>
                    {target.displayName}
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => handleUnblock(target)}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel={`Unblock ${target.displayName}`}
                  style={({ pressed }) => [styles.pill, (pressed || busy) && styles.pressed]}>
                  <ThemedText style={styles.pillText}>Unblock</ThemedText>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, gap: 24 },
  loading: { paddingVertical: 20 },
  empty: { paddingHorizontal: 16, paddingVertical: 16, fontSize: 15 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 60,
  },
  person: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  name: { flex: 1, fontSize: 16, lineHeight: 21 },
  pill: {
    backgroundColor: '#FF3B301A',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  pillText: { color: '#FF3B30', fontSize: 14, lineHeight: 18, fontWeight: '600' },
  pressed: { opacity: 0.6 },
});
