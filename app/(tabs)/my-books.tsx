import { router } from 'expo-router';
import { Alert, FlatList, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookCard } from '@/components/book-card';
import { ThemedText } from '@/components/themed-text';
import { CardSeparator } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenTitle } from '@/components/ui/screen-title';
import { ACCENT_COLOR } from '@/constants/theme';
import { useBookMutations } from '@/hooks/use-book-mutations';
import { useMyBooks } from '@/hooks/use-my-books';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Book } from '@/types/book';

const DESTRUCTIVE = '#FF3B30';

function AvailabilityChip({ available }: { available: boolean }) {
  const color = available ? '#2B8A3E' : '#8E8E93';
  return (
    <View style={[styles.chip, { backgroundColor: `${color}1F` }]}>
      <View style={[styles.chipDot, { backgroundColor: color }]} />
      <ThemedText style={[styles.chipText, { color }]}>{available ? 'Available' : 'Unavailable'}</ThemedText>
    </View>
  );
}

export default function MyBooksScreen() {
  const { books, loading } = useMyBooks();
  const { deleteBook } = useBookMutations();
  const insets = useSafeAreaInsets();
  const background = useThemeColor({}, 'groupedBackground');
  const muted = useThemeColor({}, 'mutedText');
  const separator = useThemeColor({}, 'separator');

  const confirmDelete = (book: Book) => {
    const performDelete = () => deleteBook(book.id);
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${book.title}"? This can't be undone.`)) performDelete();
      return;
    }
    Alert.alert('Delete book', `Delete "${book.title}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: performDelete },
    ]);
  };

  const availableCount = books.filter((b) => b.available).length;

  return (
    <FlatList
      style={{ backgroundColor: background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      data={books}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => <View style={styles.gap} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <ScreenTitle
            title="My Books"
            subtitle={books.length ? `${books.length} listed · ${availableCount} available` : undefined}
            action={{ icon: 'plus', label: 'Add a book', onPress: () => router.push('/add-book') }}
          />
        </View>
      }
      ListEmptyComponent={
        !loading ? (
          <View style={styles.emptyState}>
            <IconSymbol name="books.vertical.fill" size={40} color={muted} />
            <ThemedText style={[styles.emptyText, { color: muted }]}>
              You haven&apos;t listed any books yet.
            </ThemedText>
            <Pressable
              onPress={() => router.push('/add-book')}
              style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}>
              <ThemedText style={styles.emptyButtonText}>List your first book</ThemedText>
            </Pressable>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <BookCard
          book={item}
          meta={item.genre}
          accessory={<AvailabilityChip available={item.available} />}
          footer={
            <>
              <CardSeparator inset={0} />
              <View style={styles.actions}>
                <Pressable
                  onPress={() => router.push(`/edit-book/${item.id}`)}
                  style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
                  <IconSymbol name="pencil" size={16} color={ACCENT_COLOR} />
                  <ThemedText style={[styles.actionText, { color: ACCENT_COLOR }]}>Edit</ThemedText>
                </Pressable>
                <View style={[styles.actionDivider, { backgroundColor: separator }]} />
                <Pressable
                  onPress={() => confirmDelete(item)}
                  style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
                  <IconSymbol name="trash" size={16} color={DESTRUCTIVE} />
                  <ThemedText style={[styles.actionText, { color: DESTRUCTIVE }]}>Delete</ThemedText>
                </Pressable>
              </View>
            </>
          }
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 },
  header: { marginBottom: 16 },
  gap: { height: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  actions: { flexDirection: 'row' },
  actionDivider: { width: StyleSheet.hairlineWidth },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
  },
  actionText: { fontSize: 15, fontWeight: '600' },
  pressed: { opacity: 0.6 },
  emptyState: { alignItems: 'center', gap: 12, marginTop: 48 },
  emptyText: { fontSize: 16 },
  emptyButton: { backgroundColor: ACCENT_COLOR, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
  emptyButtonText: { color: '#fff', fontWeight: '600' },
});
