import { router } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { BookCard, BookCover } from '@/components/book-card';
import { ThemedText } from '@/components/themed-text';
import { ScreenTitle } from '@/components/ui/screen-title';
import { useAuth } from '@/contexts/auth-context';
import { useBooks, useBooksFromOwners } from '@/hooks/use-books';
import { useFollowing } from '@/hooks/use-follows';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatDistanceMiles, haversineDistanceMiles } from '@/lib/geo';
import type { Book } from '@/types/book';

/** Horizontal shelf of the newest books from people you follow. */
function FollowingShelf({ ownerIds }: { ownerIds: string[] }) {
  const { books, loading, error } = useBooksFromOwners(ownerIds);
  const muted = useThemeColor({}, 'mutedText');

  if (ownerIds.length === 0) return null;

  return (
    <View style={styles.section}>
      <ThemedText style={[styles.sectionTitle, { color: muted }]}>FROM PEOPLE YOU FOLLOW</ThemedText>
      {error ? (
        <ThemedText style={[styles.sectionNote, { color: muted }]}>
          Couldn&apos;t load this shelf right now.
        </ThemedText>
      ) : !loading && books.length === 0 ? (
        <ThemedText style={[styles.sectionNote, { color: muted }]}>
          No new books from people you follow yet.
        </ThemedText>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelf}>
          {books.map((book) => (
            <Pressable
              key={book.id}
              onPress={() => router.push(`/book/${book.id}`)}
              style={({ pressed }) => [styles.shelfItem, pressed && styles.pressed]}>
              <BookCover uri={book.coverUrl} width={112} />
              <ThemedText style={styles.shelfTitle} numberOfLines={2}>
                {book.title}
              </ThemedText>
              <View style={styles.shelfOwner}>
                <Avatar name={book.ownerName} uid={book.ownerId} size={18} />
                <ThemedText style={[styles.shelfOwnerName, { color: muted }]} numberOfLines={1}>
                  {book.ownerName}
                </ThemedText>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const { books, loading } = useBooks();
  const { user, profile } = useAuth();
  const { follows: following } = useFollowing(user?.uid);
  const insets = useSafeAreaInsets();
  const background = useThemeColor({}, 'groupedBackground');
  const muted = useThemeColor({}, 'mutedText');

  const availableBooks = useMemo(
    () => books.filter((book) => book.ownerId !== user?.uid && book.available),
    [books, user]
  );
  const followeeIds = following.map((f) => f.followeeId);

  const metaFor = (book: Book) => {
    const distance =
      profile?.location && book.location ? haversineDistanceMiles(profile.location, book.location) : undefined;
    return [book.genre, distance !== undefined ? formatDistanceMiles(distance) : null, book.ownerName]
      .filter(Boolean)
      .join(' · ');
  };

  return (
    <FlatList
      style={{ backgroundColor: background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      data={availableBooks}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => <View style={styles.gap} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <ScreenTitle
            title="Discover"
            subtitle="Books you can borrow in person"
            action={{ icon: 'plus', label: 'Add a book', onPress: () => router.push('/add-book') }}
          />
          <FollowingShelf ownerIds={followeeIds} />
          <ThemedText style={[styles.sectionTitle, { color: muted }]}>
            AVAILABLE NOW ({availableBooks.length})
          </ThemedText>
        </View>
      }
      ListEmptyComponent={
        !loading ? (
          <ThemedText style={[styles.empty, { color: muted }]}>
            No books listed yet. Be the first to add one!
          </ThemedText>
        ) : null
      }
      renderItem={({ item }) => <BookCard book={item} meta={metaFor(item)} />}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 },
  header: { gap: 20, marginBottom: 10 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 13, lineHeight: 18, fontWeight: '600', letterSpacing: 0.6, marginLeft: 4 },
  sectionNote: { fontSize: 14, marginLeft: 4 },
  shelf: { gap: 14, paddingRight: 16 },
  shelfItem: { width: 112, gap: 6 },
  shelfTitle: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  shelfOwner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shelfOwnerName: { flex: 1, fontSize: 12, lineHeight: 16 },
  pressed: { opacity: 0.7 },
  gap: { height: 10 },
  empty: { textAlign: 'center', marginTop: 24 },
});
