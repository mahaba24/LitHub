import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { FollowCounts } from '@/components/profile/follow-counts';
import { ProfileStats } from '@/components/profile/profile-stats';
import { ReviewsSection } from '@/components/profile/reviews-section';
import { ThemedText } from '@/components/themed-text';
import { Card, CardSeparator } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { NavRow } from '@/components/ui/nav-row';
import { ACCENT_COLOR } from '@/constants/theme';
import { RecentLoginRequiredError, useAuth } from '@/contexts/auth-context';
import { useFollowing } from '@/hooks/use-follows';
import { useDeviceLocation } from '@/hooks/use-location';
import { useMyRequests } from '@/hooks/use-requests';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { confirm, notify } from '@/lib/confirm';
import { requestNeedsActionFrom } from '@/lib/requests';

const DESTRUCTIVE = '#FF3B30';

export default function AccountScreen() {
  const { user, profile, profileStatus, profileError, signOut, updateLocation, deleteAccount } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const { status, requestLocation } = useDeviceLocation();
  const { requests } = useMyRequests();
  const { follows: following } = useFollowing(user?.uid);
  const insets = useSafeAreaInsets();
  const background = useThemeColor({}, 'groupedBackground');
  const muted = useThemeColor({}, 'mutedText');

  const pendingCount = user ? requests.filter((r) => requestNeedsActionFrom(r, user.uid)).length : 0;
  const displayName =
    profile?.displayName ??
    (profileStatus === 'creating'
      ? 'Setting up your profile…'
      : profileStatus === 'error'
        ? user?.displayName || 'Profile unavailable'
        : 'Loading…');
  const isLocating = status === 'requesting';

  const runDelete = async () => {
    setDeleting(true);
    try {
      // On success the auth listener signs us out and the router guard
      // sends the user to the auth screens; nothing else to do here.
      await deleteAccount();
    } catch (error) {
      setDeleting(false);
      if (error instanceof RecentLoginRequiredError) {
        const signInAgain = await confirm({
          title: 'Please sign in again',
          message:
            'For your security, Firebase needs you to have signed in recently before deleting your account. Nothing has been deleted. Sign in again, then tap “Delete my account”.',
          confirmLabel: 'Sign In Again',
        });
        if (signInAgain) await signOut();
        return;
      }
      notify('Couldn’t delete account', getAuthErrorMessage(error));
    }
  };

  const confirmDelete = async () => {
    const ok = await confirm({
      title: 'Delete your account?',
      message:
        'This permanently deletes your login, profile, location, listed books, follows and block list. Messages and reviews you wrote will stay but show “Deleted user”. This can’t be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (ok) await runDelete();
  };

  const handleShareLocation = async () => {
    const point = await requestLocation();
    if (point) await updateLocation(point);
  };

  return (
    <ScrollView
      style={{ backgroundColor: background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}>
      <View style={styles.header}>
        <Avatar name={profile?.displayName ?? user?.displayName ?? user?.email} uid={user?.uid} size={88} />
        <ThemedText type="subtitle" style={styles.name} numberOfLines={1}>
          {displayName}
        </ThemedText>
        <ThemedText style={[styles.email, { color: muted }]} numberOfLines={1}>
          {user?.email}
        </ThemedText>
        {profileStatus === 'error' && (
          <ThemedText style={styles.error}>Couldn&apos;t load your profile: {profileError}</ThemedText>
        )}
        {user && <FollowCounts uid={user.uid} />}
      </View>

      {user && <ProfileStats uid={user.uid} profile={profile} />}

      <Card title="Activity">
        <NavRow
          icon="arrow.left.arrow.right"
          iconColor={ACCENT_COLOR}
          label="My Requests"
          detail={pendingCount > 0 ? `${pendingCount} waiting on you` : 'Borrowing and lending'}
          badge={pendingCount}
          onPress={() => router.push('/requests')}
        />
        <CardSeparator />
        <NavRow
          icon="bubble.left.and.bubble.right.fill"
          iconColor="#34C759"
          label="My Chats"
          detail="Conversations with lenders and borrowers"
          onPress={() => router.push('/chats')}
        />
        <CardSeparator />
        <NavRow
          icon="person.2.fill"
          iconColor="#6741D9"
          label="Following"
          detail={
            following.length > 0
              ? `${following.length} ${following.length === 1 ? 'reader' : 'readers'} · new books show on Home`
              : 'Follow readers to see their new books'
          }
          onPress={() =>
            user && router.push({ pathname: '/connections/[id]', params: { id: user.uid, tab: 'following' } })
          }
        />
      </Card>

      {user && <ReviewsSection uid={user.uid} />}

      <Card
        title="Location"
        footer="Only used to show how far away listings are. Your exact address is never shared.">
        <View style={styles.locationRow}>
          <View style={[styles.iconTile, { backgroundColor: '#FF9500' }]}>
            <IconSymbol name="location.fill" size={18} color="#fff" />
          </View>
          <View style={styles.locationText}>
            <ThemedText style={styles.rowLabel}>{profile?.location ? 'Location shared' : 'Not shared yet'}</ThemedText>
            {profile?.location && (
              <ThemedText style={[styles.rowDetail, { color: muted }]}>
                {profile.location.latitude.toFixed(3)}, {profile.location.longitude.toFixed(3)}
              </ThemedText>
            )}
          </View>
          <Pressable
            onPress={handleShareLocation}
            disabled={isLocating}
            style={({ pressed }) => [styles.pillButton, (pressed || isLocating) && styles.pressed]}>
            <ThemedText style={styles.pillButtonText}>
              {isLocating ? 'Locating…' : profile?.location ? 'Update' : 'Share'}
            </ThemedText>
          </Pressable>
        </View>
        {(status === 'denied' || status === 'error') && (
          <ThemedText style={[styles.error, styles.cardError]}>
            {status === 'denied' ? 'Location permission was denied.' : 'Couldn’t get your location.'}
          </ThemedText>
        )}
      </Card>

      <Card title="Privacy & Safety">
        <NavRow
          icon="nosign"
          iconColor="#FF3B30"
          label="Blocked users"
          detail="See and unblock people you've blocked"
          onPress={() => router.push('/blocked-users')}
        />
        <CardSeparator />
        <NavRow
          icon="hand.raised.fill"
          iconColor="#5856D6"
          label="Privacy Policy"
          detail="What we store and why"
          onPress={() => router.push('/privacy')}
        />
      </Card>

      <Card>
        <Pressable
          onPress={() => signOut()}
          accessibilityRole="button"
          style={({ pressed }) => [styles.signOutRow, pressed && styles.pressed]}>
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={18} color={DESTRUCTIVE} />
          <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
        </Pressable>
      </Card>

      <Card footer="Permanently deletes your login, profile, books, follows and block list. Your messages and reviews stay, shown as “Deleted user”.">
        <Pressable
          onPress={confirmDelete}
          disabled={deleting}
          accessibilityRole="button"
          style={({ pressed }) => [styles.signOutRow, (pressed || deleting) && styles.pressed]}>
          {deleting ? (
            <ActivityIndicator color={DESTRUCTIVE} />
          ) : (
            <IconSymbol name="trash" size={18} color={DESTRUCTIVE} />
          )}
          <ThemedText style={styles.signOutText}>{deleting ? 'Deleting account…' : 'Delete my account'}</ThemedText>
        </Pressable>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 28,
  },
  header: {
    alignItems: 'center',
    gap: 4,
  },
  name: {
    marginTop: 12,
  },
  email: {
    fontSize: 15,
  },
  error: {
    color: DESTRUCTIVE,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  cardError: {
    textAlign: 'left',
    marginTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  locationRow: {
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
  locationText: {
    flex: 1,
    gap: 1,
  },
  rowLabel: {
    fontSize: 16,
    lineHeight: 21,
  },
  rowDetail: {
    fontSize: 13,
    lineHeight: 17,
  },
  pillButton: {
    backgroundColor: ACCENT_COLOR,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  pillButtonText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.6,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  signOutText: {
    color: DESTRUCTIVE,
    fontSize: 16,
    fontWeight: '600',
  },
});
