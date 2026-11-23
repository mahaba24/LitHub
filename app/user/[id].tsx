import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { BookCard } from '@/components/book-card';
import { FollowButton } from '@/components/profile/follow-button';
import { FollowCounts } from '@/components/profile/follow-counts';
import { ProfileStats } from '@/components/profile/profile-stats';
import { ReviewsSection } from '@/components/profile/reviews-section';
import { useUserSafety } from '@/components/safety/use-user-safety';
import { ThemedText } from '@/components/themed-text';
import { Card, CardSeparator } from '@/components/ui/card';
import { NavRow } from '@/components/ui/nav-row';
import { useAuth } from '@/contexts/auth-context';
import { useBooksByOwner } from '@/hooks/use-books';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useUserProfile } from '@/hooks/use-user-profile';

/** Someone else's public profile: stats, follow button, their shelf, reviews. */
export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { profile, loading } = useUserProfile(id);
  const { books } = useBooksByOwner(id);
  const background = useThemeColor({}, 'groupedBackground');
  const muted = useThemeColor({}, 'mutedText');
  const name = profile?.displayName ?? (loading ? 'Loading…' : 'Deleted user');
  const safety = useUserSafety({ uid: id, name: profile?.displayName ?? 'this reader', source: 'profile' });

  // Your own profile lives on the Account tab (with settings).
  if (id && id === user?.uid) return <Redirect href="/account" />;

  const available = books.filter((b) => b.available);

  return (
    <>
      <Stack.Screen options={{ title: profile?.displayName ?? 'Profile' }} />
      <ScrollView style={{ backgroundColor: background }} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Avatar name={profile?.displayName} uid={id} size={88} />
          <ThemedText type="subtitle" style={styles.name} numberOfLines={1}>
            {name}
          </ThemedText>
          {id && <FollowCounts uid={id} />}
          {id && profile && !safety.isBlocked && (
            <View style={styles.followButton}>
              <FollowButton uid={id} displayName={profile.displayName} />
            </View>
          )}
          {safety.isBlocked && (
            <ThemedText style={[styles.blockedNote, { color: muted }]}>
              You’ve blocked {name}. Neither of you can send requests or messages.
            </ThemedText>
          )}
          {!loading && !profile && (
            <ThemedText style={{ color: muted }}>This reader hasn&apos;t set up a profile.</ThemedText>
          )}
        </View>

        {id && <ProfileStats uid={id} profile={profile} />}

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: muted }]}>
            ON THEIR SHELF{safety.isBlocked ? '' : ` (${available.length})`}
          </ThemedText>
          {safety.isBlocked ? (
            <ThemedText style={[styles.empty, { color: muted }]}>Hidden because you blocked {name}.</ThemedText>
          ) : available.length === 0 ? (
            <ThemedText style={[styles.empty, { color: muted }]}>No books available right now.</ThemedText>
          ) : (
            available.map((book) => <BookCard key={book.id} book={book} meta={book.genre} />)
          )}
        </View>

        {id && <ReviewsSection uid={id} />}

        {id && profile && (
          <Card title="Safety" footer="Reports go to the LitHub team and are never shown to the person you report.">
            <NavRow
              icon="exclamationmark.bubble.fill"
              iconColor="#FF9500"
              label={`Report ${name}`}
              detail="Spam, inappropriate behaviour or an unsafe meetup"
              onPress={safety.openReport}
            />
            <CardSeparator />
            <NavRow
              icon="nosign"
              iconColor="#FF3B30"
              label={safety.isBlocked ? `Unblock ${name}` : `Block ${name}`}
              detail={safety.isBlocked ? 'Allow requests and messages again' : 'Stop requests and messages both ways'}
              onPress={safety.isBlocked ? safety.confirmAndUnblock : safety.confirmAndBlock}
            />
          </Card>
        )}
      </ScrollView>
      {safety.reportSheet}
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, gap: 24 },
  header: { alignItems: 'center', gap: 4, paddingTop: 8 },
  name: { marginTop: 12 },
  followButton: { marginTop: 12 },
  blockedNote: { marginTop: 12, textAlign: 'center', fontSize: 14, lineHeight: 19, paddingHorizontal: 24 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 13, lineHeight: 18, fontWeight: '600', letterSpacing: 0.6, marginLeft: 16 },
  empty: { marginLeft: 16 },
});
