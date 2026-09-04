import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { Alert, FlatList, Platform, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useBookMutations } from '@/hooks/use-book-mutations';
import { useMyBooks } from '@/hooks/use-my-books';
import type { Book } from '@/types/book';

export default function MyBooksScreen() {
  const { books, loading } = useMyBooks();
  const { deleteBook } = useBookMutations();

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

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={books}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <ThemedView style={styles.header}>
          <ThemedText type="title">My Books</ThemedText>
          <Pressable style={styles.addButton} onPress={() => router.push('/add-book')}>
            <ThemedText type="link">+ Add a Book</ThemedText>
          </Pressable>
        </ThemedView>
      }
      ListEmptyComponent={
        !loading ? (
          <ThemedView style={styles.empty}>
            <ThemedText>You haven&apos;t listed any books yet.</ThemedText>
          </ThemedView>
        ) : null
      }
      renderItem={({ item }) => (
        <ThemedView style={styles.row}>
          <Link href={`/book/${item.id}`} asChild>
            <Pressable style={styles.rowMain}>
              {item.coverUrl ? (
                <Image source={{ uri: item.coverUrl }} style={styles.cover} contentFit="cover" />
              ) : (
                <ThemedView style={styles.coverPlaceholder} />
              )}
              <ThemedView style={styles.info}>
                <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                <ThemedText>{item.author}</ThemedText>
                <ThemedText style={styles.status}>
                  {item.available ? 'Available' : 'Unavailable'}
                </ThemedText>
              </ThemedView>
            </Pressable>
          </Link>
          <ThemedView style={styles.actions}>
            <Pressable onPress={() => router.push(`/edit-book/${item.id}`)}>
              <ThemedText type="link">Edit</ThemedText>
            </Pressable>
            <Pressable onPress={() => confirmDelete(item)}>
              <ThemedText style={styles.deleteText}>Delete</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 8,
    gap: 8,
  },
  addButton: {
    alignSelf: 'flex-start',
  },
  empty: {
    padding: 20,
  },
  row: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  rowMain: {
    flexDirection: 'row',
    gap: 12,
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
  status: {
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    gap: 20,
    paddingLeft: 60,
  },
  deleteText: {
    color: '#c0392b',
  },
});
