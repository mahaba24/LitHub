import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput } from 'react-native';

import { BookForm, type BookFormValues } from '@/components/book-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useBookMutations } from '@/hooks/use-book-mutations';
import { useThemeColor } from '@/hooks/use-theme-color';
import { searchOpenLibrary, type OpenLibraryResult } from '@/lib/open-library';

export default function AddBookScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OpenLibraryResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<BookFormValues | null>(null);
  const [manualEntry, setManualEntry] = useState(false);
  const { createBook, status } = useBookMutations();
  const textColor = useThemeColor({}, 'text');

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearchError(null);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(() => {
      searchOpenLibrary(query, controller.signal)
        .then((docs) => {
          setResults(docs);
          setSearchError(null);
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          setSearchError(error instanceof Error ? error.message : 'Search failed');
        })
        .finally(() => setSearching(false));
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleSelect = (result: OpenLibraryResult) => {
    setSelected({
      title: result.title,
      author: result.author,
      coverUrl: result.coverUrl,
      isbn: result.isbn,
      genre: '',
      condition: 'Good',
      description: '',
      available: true,
    });
  };

  const handleSubmit = async (values: BookFormValues) => {
    const id = await createBook(values);
    router.replace(`/book/${id}`);
  };

  const showForm = selected || manualEntry;

  return (
    <>
      <Stack.Screen options={{ title: 'Add a Book' }} />
      <FlatList
        contentContainerStyle={styles.content}
        data={showForm ? [] : results}
        keyExtractor={(item) => item.key}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <ThemedView style={styles.header}>
            {showForm ? (
              <>
                <Pressable
                  onPress={() => {
                    setSelected(null);
                    setManualEntry(false);
                  }}>
                  <ThemedText type="link">← Back to search</ThemedText>
                </Pressable>
                <ThemedText type="subtitle" style={styles.formTitle}>
                  {selected ? 'Confirm details' : 'Enter book manually'}
                </ThemedText>
                <BookForm
                  initialValues={selected ?? undefined}
                  submitLabel="Add to my listings"
                  submitting={status === 'saving'}
                  onSubmit={handleSubmit}
                />
              </>
            ) : (
              <>
                <ThemedText type="subtitle">Search by title, author, or ISBN</ThemedText>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="e.g. Dune, or 9780441013593"
                  autoCapitalize="none"
                  style={[styles.input, { color: textColor }]}
                />
                {searching && <ActivityIndicator style={styles.spinner} />}
                {searchError && <ThemedText style={styles.error}>{searchError}</ThemedText>}
                <Pressable onPress={() => setManualEntry(true)} style={styles.manualLink}>
                  <ThemedText type="link">Can&apos;t find your book? Enter it manually</ThemedText>
                </Pressable>
              </>
            )}
          </ThemedView>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.result} onPress={() => handleSelect(item)}>
            {item.coverUrl ? (
              <Image source={{ uri: item.coverUrl }} style={styles.resultCover} contentFit="cover" />
            ) : (
              <ThemedView style={styles.resultCoverPlaceholder} />
            )}
            <ThemedView style={styles.resultText}>
              <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
              <ThemedText>{item.author}</ThemedText>
              {item.firstPublishYear && <ThemedText style={styles.year}>{item.firstPublishYear}</ThemedText>}
            </ThemedView>
          </Pressable>
        )}
      />
    </>
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
  formTitle: {
    marginBottom: 4,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#687076',
    borderRadius: 8,
    padding: 12,
  },
  spinner: {
    marginTop: 4,
  },
  error: {
    color: '#c0392b',
  },
  manualLink: {
    marginTop: 4,
  },
  result: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  resultCover: {
    width: 48,
    height: 72,
    borderRadius: 4,
  },
  resultCoverPlaceholder: {
    width: 48,
    height: 72,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#687076',
  },
  resultText: {
    flex: 1,
    gap: 2,
  },
  year: {
    opacity: 0.6,
  },
});
