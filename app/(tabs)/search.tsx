import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookCard } from '@/components/book-card';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenTitle } from '@/components/ui/screen-title';
import { useAuth } from '@/contexts/auth-context';
import { useBooks } from '@/hooks/use-books';
import { useMyBooks } from '@/hooks/use-my-books';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatDistanceMiles, haversineDistanceMiles } from '@/lib/geo';
import type { Book } from '@/types/book';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const muted = useThemeColor({}, 'mutedText');
  return (
    <View style={styles.section}>
      <ThemedText style={[styles.sectionTitle, { color: muted }]}>{title}</ThemedText>
      {children}
    </View>
  );
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const { books } = useBooks();
  const { books: myBooks } = useMyBooks();
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const textColor = useThemeColor({}, 'text');
  const background = useThemeColor({}, 'groupedBackground');
  const card = useThemeColor({}, 'card');
  const muted = useThemeColor({}, 'mutedText');

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
  const metaFor = (book: Book, distance?: number) =>
    [book.genre, distance !== undefined ? formatDistanceMiles(distance) : null].filter(Boolean).join(' · ');

  return (
    <FlatList
      style={{ backgroundColor: background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      data={isSearching ? filtered : []}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      ItemSeparatorComponent={() => <View style={styles.gap} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <ScreenTitle title="Search" />
          <View style={[styles.searchField, { backgroundColor: card }]}>
            <IconSymbol name="magnifyingglass" size={18} color={muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Title, author, or ISBN"
              placeholderTextColor={muted}
              returnKeyType="search"
              autoCorrect={false}
              style={[styles.input, { color: textColor }]}
            />
            {isSearching && (
              <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
                <ThemedText style={[styles.clear, { color: muted }]}>✕</ThemedText>
              </Pressable>
            )}
          </View>

          {isSearching &&
            (filtered.length === 0 ? (
              <ThemedText style={[styles.empty, { color: muted }]}>No books match “{query.trim()}”.</ThemedText>
            ) : (
              <ThemedText style={[styles.sectionTitle, { color: muted }]}>
                {filtered.length} RESULT{filtered.length === 1 ? '' : 'S'}
              </ThemedText>
            ))}

          {!isSearching && (
            <>
              {nearby.length > 0 && (
                <Section title="NEARBY">
                  {nearby.map(({ book, distance }) => (
                    <BookCard key={book.id} book={book} meta={metaFor(book, distance)} />
                  ))}
                </Section>
              )}
              {sameGenre.length > 0 && (
                <Section title="SIMILAR TO YOUR BOOKS">
                  {sameGenre.map((book) => (
                    <BookCard key={book.id} book={book} meta={metaFor(book)} />
                  ))}
                </Section>
              )}
              {nearby.length === 0 && sameGenre.length === 0 && (
                <ThemedText style={[styles.empty, { color: muted }]}>
                  Search for a book, or list one of your own to see recommendations.
                </ThemedText>
              )}
            </>
          )}
        </View>
      }
      renderItem={({ item }) => <BookCard book={item} meta={metaFor(item)} />}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 },
  header: { gap: 20, marginBottom: 10 },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 12 },
  clear: { fontSize: 14, paddingHorizontal: 4 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 13, lineHeight: 18, fontWeight: '600', letterSpacing: 0.6, marginLeft: 4 },
  empty: { textAlign: 'center', marginTop: 8, lineHeight: 21 },
  gap: { height: 10 },
});
