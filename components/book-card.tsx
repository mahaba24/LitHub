import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Book } from '@/types/book';

type Props = {
  book: Book;
  /** Muted third line (genre · distance, request count, …). */
  meta?: string;
  /** Replaces the default chevron on the right. */
  accessory?: ReactNode;
  /** Extra content under the row inside the same card (e.g. action buttons). */
  footer?: ReactNode;
};

export function BookCover({ uri, width = 52 }: { uri: string | null; width?: number }) {
  const placeholder = useThemeColor({ light: '#E5E7EB', dark: '#2A2C2F' }, 'card');
  const muted = useThemeColor({}, 'mutedText');
  const size = { width, height: width * 1.5, borderRadius: Math.max(6, width / 10) };
  return uri ? (
    <Image source={{ uri }} style={[styles.cover, size]} contentFit="cover" transition={150} />
  ) : (
    <View style={[styles.cover, size, styles.placeholder, { backgroundColor: placeholder }]}>
      <IconSymbol name="book.fill" size={width * 0.4} color={muted} />
    </View>
  );
}

/** A book as a rounded card: cover · title/author/meta · chevron. Taps open the book. */
export function BookCard({ book, meta, accessory, footer }: Props) {
  const card = useThemeColor({}, 'card');
  const muted = useThemeColor({}, 'mutedText');

  return (
    <View style={[styles.card, { backgroundColor: card }]}>
      <Pressable
        onPress={() => router.push(`/book/${book.id}`)}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <BookCover uri={book.coverUrl} />
        <View style={styles.info}>
          <ThemedText style={styles.title} numberOfLines={2}>
            {book.title}
          </ThemedText>
          <ThemedText style={[styles.author, { color: muted }]} numberOfLines={1}>
            {book.author}
          </ThemedText>
          {meta ? (
            <ThemedText style={[styles.meta, { color: muted }]} numberOfLines={1}>
              {meta}
            </ThemedText>
          ) : null}
        </View>
        {accessory ?? <IconSymbol name="chevron.right" size={14} color={muted} />}
      </Pressable>
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12 },
  pressed: { opacity: 0.7 },
  cover: { overflow: 'hidden' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 2 },
  title: { fontSize: 16, lineHeight: 21, fontWeight: '600' },
  author: { fontSize: 14, lineHeight: 19 },
  meta: { fontSize: 12, lineHeight: 16, marginTop: 2 },
});
