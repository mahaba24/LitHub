import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { BookCard } from '@/components/book-card';
import { FollowButton } from '@/components/profile/follow-button';
import { FollowCounts } from '@/components/profile/follow-counts';
import { ProfileStats } from '@/components/profile/profile-stats';
import { ReviewsSection } from '@/components/profile/reviews-section';
import { ThemedText } from '@/components/themed-text';
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

  // Your own profile lives on the Account tab (with settings).
  if (id && id === user?.uid) return <Redirect href="/account" />;

  const name = profile?.displayName ?? (loading ? 'Loading…' : 'Unknown reader');
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
          {id && profile && (
            <View style={styles.followButton}>
              <FollowButton uid={id} displayName={profile.displayName} />
            </View>
          )}
          {!loading && !profile && (
            <ThemedText style={{ color: muted }}>This reader hasn&apos;t set up a profile.</ThemedText>
          )}
        </View>

        {id && <ProfileStats uid={id} profile={profile} />}

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: muted }]}>
            ON THEIR SHELF ({available.length})
          </ThemedText>
          {available.length === 0 ? (
            <ThemedText style={[styles.empty, { color: muted }]}>No books available right now.</ThemedText>
          ) : (
            available.map((book) => <BookCard key={book.id} book={book} meta={book.genre} />)
          )}
        </View>

        {id && <ReviewsSection uid={id} />}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, gap: 24 },
  header: { alignItems: 'center', gap: 4, paddingTop: 8 },
  name: { marginTop: 12 },
  followButton: { marginTop: 12 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 13, lineHeight: 18, fontWeight: '600', letterSpacing: 0.6, marginLeft: 16 },
  empty: { marginLeft: 16 },
});
