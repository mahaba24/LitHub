import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { useBooks } from '@/hooks/use-books';
import { useMyBooks } from '@/hooks/use-my-books';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatDistanceMiles, haversineDistanceMiles } from '@/lib/geo';
import type { Book } from '@/types/book';

function BookRow({ book, distanceMiles }: { book: Book; distanceMiles?: number }) {
  return (
    <Link href={`/book/${book.id}`} asChild>
      <Pressable style={styles.row}>
        {book.coverUrl ? (
          <Image source={{ uri: book.coverUrl }} style={styles.cover} contentFit="cover" />
        ) : (
          <ThemedView style={styles.coverPlaceholder} />
        )}
        <ThemedView style={styles.info}>
          <ThemedText type="defaultSemiBold">{book.title}</ThemedText>
          <ThemedText>{book.author}</ThemedText>
          <ThemedText style={styles.meta}>
            {book.genre}
            {distanceMiles !== undefined ? ` · ${formatDistanceMiles(distanceMiles)}` : ''}
          </ThemedText>
        </ThemedView>
      </Pressable>
    </Link>
  );
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const { books } = useBooks();
  const { books: myBooks } = useMyBooks();
  const { user, profile } = useAuth();
  const textColor = useThemeColor({}, 'text');

  const otherBooks = useMemo(() => books.filter((b) => b.ownerId !== user?.uid), [books, user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return otherBooks.filter(
      (book) =>
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.isbn?.toLowerCase().includes(q)
    );
  }, [otherBooks, query]);

  const nearby = useMemo(() => {
    if (!profile?.location) return [];
    const origin = profile.location;
    return otherBooks
      .filter((book) => book.location)
      .map((book) => ({ book, distance: haversineDistanceMiles(origin, book.location!) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [otherBooks, profile]);

  const myGenres = useMemo(
    () => new Set(myBooks.map((b) => b.genre.toLowerCase()).filter(Boolean)),
    [myBooks]
  );
  const sameGenre = useMemo(
    () => otherBooks.filter((book) => myGenres.has(book.genre.toLowerCase())).slice(0, 5),
    [otherBooks, myGenres]
  );

  const isSearching = query.trim().length > 0;

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={isSearching ? filtered : []}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <ThemedView style={styles.header}>
          <ThemedText type="title">Search</ThemedText>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by title, author, or ISBN"
            style={[styles.input, { color: textColor }]}
          />
          {isSearching && filtered.length === 0 && (
            <ThemedText style={styles.empty}>No books match &quot;{query}&quot;.</ThemedText>
          )}

          {!isSearching && (
            <>
              {nearby.length > 0 && (
                <ThemedView style={styles.section}>
                  <ThemedText type="subtitle">Nearby</ThemedText>
                  {nearby.map(({ book, distance }) => (
                    <BookRow key={book.id} book={book} distanceMiles={distance} />
                  ))}
                </ThemedView>
              )}
              {sameGenre.length > 0 && (
                <ThemedView style={styles.section}>
                  <ThemedText type="subtitle">Similar to Your Books</ThemedText>
                  {sameGenre.map((book) => (
                    <BookRow key={book.id} book={book} />
                  ))}
                </ThemedView>
              )}
              {nearby.length === 0 && sameGenre.length === 0 && (
                <ThemedText style={styles.empty}>
                  Search for a book, or list one of your own to see recommendations.
                </ThemedText>
              )}
            </>
          )}
        </ThemedView>
      }
      renderItem={({ item }) => <BookRow book={item} />}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  header: {
    padding: 20,
    gap: 8,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#687076',
    borderRadius: 8,
    padding: 12,
  },
  empty: {
    opacity: 0.7,
    marginTop: 8,
  },
  section: {
    marginTop: 16,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cover: {
    width: 48,
    height: 72,
    borderRadius: 4,
  },
  coverPlaceholder: {
    width: 48,
    height: 72,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#687076',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  meta: {
    opacity: 0.7,
  },
});
