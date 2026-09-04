import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useBookOfTheMonth, useTopReaders } from '@/hooks/use-leaderboard';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const { readers, loading: readersLoading } = useTopReaders();
  const { entries, loading: booksLoading } = useBookOfTheMonth();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Leaderboard</ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Top Readers</ThemedText>
        {!readersLoading && readers.length === 0 && (
          <ThemedText style={styles.empty}>No readers yet — complete an exchange to get ranked.</ThemedText>
        )}
        {readers.map((reader, index) => (
          <ThemedView key={reader.uid} style={styles.row}>
            <ThemedText style={styles.rank}>{RANK_MEDALS[index] ?? `#${index + 1}`}</ThemedText>
            <ThemedView style={styles.info}>
              <ThemedText type="defaultSemiBold">{reader.displayName}</ThemedText>
              <ThemedText style={styles.meta}>
                {reader.completedReturns} returns · {reader.reviewCount} reviews
              </ThemedText>
            </ThemedView>
            <ThemedText type="defaultSemiBold">{Math.round(reader.trustScore)}</ThemedText>
          </ThemedView>
        ))}
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Book of the Month</ThemedText>
        {!booksLoading && entries.length === 0 && (
          <ThemedText style={styles.empty}>No requests yet this month.</ThemedText>
        )}
        {entries.map(({ book, requestCount }, index) => (
          <Link key={book.id} href={`/book/${book.id}`} asChild>
            <Pressable style={styles.row}>
              <ThemedText style={styles.rank}>{RANK_MEDALS[index] ?? `#${index + 1}`}</ThemedText>
              {book.coverUrl ? (
                <Image source={{ uri: book.coverUrl }} style={styles.cover} contentFit="cover" />
              ) : (
                <ThemedView style={styles.coverPlaceholder} />
              )}
              <ThemedView style={styles.info}>
                <ThemedText type="defaultSemiBold">{book.title}</ThemedText>
                <ThemedText style={styles.meta}>
                  {book.author} · {requestCount} request{requestCount === 1 ? '' : 's'}
                </ThemedText>
              </ThemedView>
            </Pressable>
          </Link>
        ))}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 8,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8,
  },
  empty: {
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  rank: {
    width: 32,
    fontSize: 16,
    textAlign: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  meta: {
    opacity: 0.7,
  },
  cover: {
    width: 40,
    height: 60,
    borderRadius: 4,
  },
  coverPlaceholder: {
    width: 40,
    height: 60,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#687076',
  },
});
