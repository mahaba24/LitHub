import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACCENT_COLOR } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { BookDraft } from '@/types/book';

export type BookFormValues = BookDraft;

const EMPTY_VALUES: BookFormValues = {
  title: '',
  author: '',
  coverUrl: null,
  genre: '',
  condition: 'Good',
  description: '',
  isbn: null,
  available: true,
};

export function BookForm({
  initialValues,
  submitLabel,
  onSubmit,
  submitting,
}: {
  initialValues?: Partial<BookFormValues>;
  submitLabel: string;
  onSubmit: (values: BookFormValues) => void;
  submitting: boolean;
}) {
  const [values, setValues] = useState<BookFormValues>({ ...EMPTY_VALUES, ...initialValues });
  const tint = ACCENT_COLOR;
  const textColor = useThemeColor({}, 'text');
  const inputStyle = [styles.input, { color: textColor }];

  const update = <K extends keyof BookFormValues>(key: K, value: BookFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const canSubmit = values.title.trim().length > 0 && values.author.trim().length > 0;

  return (
    <ThemedView style={styles.form}>
      {values.coverUrl ? (
        <Image source={{ uri: values.coverUrl }} style={styles.cover} contentFit="cover" />
      ) : null}

      <ThemedText type="defaultSemiBold">Title</ThemedText>
      <TextInput
        value={values.title}
        onChangeText={(text) => update('title', text)}
        placeholder="Book title"
        style={inputStyle}
      />

      <ThemedText type="defaultSemiBold">Author</ThemedText>
      <TextInput
        value={values.author}
        onChangeText={(text) => update('author', text)}
        placeholder="Author name"
        style={inputStyle}
      />

      <ThemedText type="defaultSemiBold">Genre</ThemedText>
      <TextInput
        value={values.genre}
        onChangeText={(text) => update('genre', text)}
        placeholder="e.g. Science Fiction"
        style={inputStyle}
      />

      <ThemedText type="defaultSemiBold">Condition</ThemedText>
      <TextInput
        value={values.condition}
        onChangeText={(text) => update('condition', text)}
        placeholder="e.g. Good, Like New, Worn"
        style={inputStyle}
      />

      <ThemedText type="defaultSemiBold">ISBN (optional)</ThemedText>
      <TextInput
        value={values.isbn ?? ''}
        onChangeText={(text) => update('isbn', text || null)}
        placeholder="ISBN"
        style={inputStyle}
      />

      <ThemedText type="defaultSemiBold">Cover image URL (optional)</ThemedText>
      <TextInput
        value={values.coverUrl ?? ''}
        onChangeText={(text) => update('coverUrl', text || null)}
        placeholder="https://…"
        autoCapitalize="none"
        style={inputStyle}
      />

      <ThemedText type="defaultSemiBold">Description</ThemedText>
      <TextInput
        value={values.description}
        onChangeText={(text) => update('description', text)}
        placeholder="What's it about?"
        multiline
        numberOfLines={4}
        style={[inputStyle, styles.multiline]}
      />

      <Pressable
        accessibilityRole="button"
        disabled={!canSubmit || submitting}
        onPress={() => onSubmit(values)}
        style={[
          styles.submitButton,
          { backgroundColor: tint },
          (!canSubmit || submitting) && styles.submitButtonDisabled,
        ]}>
        <ThemedText style={styles.submitButtonText} type="defaultSemiBold">
          {submitting ? 'Saving…' : submitLabel}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 8,
  },
  cover: {
    width: 120,
    height: 180,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 12,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#687076',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
  },
});
