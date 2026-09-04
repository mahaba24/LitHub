import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { BookForm, type BookFormValues } from '@/components/book-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useBookMutations } from '@/hooks/use-book-mutations';
import { useBook } from '@/hooks/use-books';

export default function EditBookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { book, loading } = useBook(id);
  const { updateBook, status } = useBookMutations();

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Loading…</ThemedText>
      </ThemedView>
    );
  }

  if (!book) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle">Book not found</ThemedText>
      </ThemedView>
    );
  }

  const handleSubmit = async (values: BookFormValues) => {
    await updateBook(book.id, values);
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Book' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <BookForm
          initialValues={book}
          submitLabel="Save changes"
          submitting={status === 'saving'}
          onSubmit={handleSubmit}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
});
