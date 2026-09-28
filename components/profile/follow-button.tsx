import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ACCENT_COLOR } from '@/constants/theme';
import { useFollowActions, useIsFollowing } from '@/hooks/use-follows';

type Props = { uid: string; displayName: string };

/** Filled "Follow" → outlined "Following" (tap again to unfollow). */
export function FollowButton({ uid, displayName }: Props) {
  const { isFollowing, loading } = useIsFollowing(uid);
  const { status, follow, unfollow } = useFollowActions();
  const [error, setError] = useState<string | null>(null);
  const busy = loading || status === 'submitting';

  const handlePress = async () => {
    setError(null);
    try {
      if (isFollowing) await unfollow(uid);
      else await follow({ uid, displayName });
    } catch (err) {
      console.warn('Follow toggle failed', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={handlePress}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={isFollowing ? `Unfollow ${displayName}` : `Follow ${displayName}`}
        style={({ pressed }) => [
          styles.button,
          isFollowing ? styles.following : styles.follow,
          (pressed || busy) && styles.dimmed,
        ]}>
        <IconSymbol
          name={isFollowing ? 'checkmark' : 'person.badge.plus'}
          size={16}
          color={isFollowing ? ACCENT_COLOR : '#fff'}
        />
        <ThemedText style={[styles.text, { color: isFollowing ? ACCENT_COLOR : '#fff' }]}>
          {isFollowing ? 'Following' : 'Follow'}
        </ThemedText>
      </Pressable>
      {error && <ThemedText style={styles.error}>{error}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 6 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
    minWidth: 140,
    justifyContent: 'center',
  },
  follow: { backgroundColor: ACCENT_COLOR },
  following: { borderWidth: 1.5, borderColor: ACCENT_COLOR },
  dimmed: { opacity: 0.6 },
  text: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  error: { color: '#FF3B30', fontSize: 13 },
});
