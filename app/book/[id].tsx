import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { BookCover } from '@/components/book-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/auth-context';
import { useBook } from '@/hooks/use-books';
import { useMyRequestForBook, useRequestActions } from '@/hooks/use-requests';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatDistanceMiles, haversineDistanceMiles } from '@/lib/geo';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { book, loading } = useBook(id);
  const { user, profile } = useAuth();
  const { request: myRequest } = useMyRequestForBook(id);
  const { status, createRequest } = useRequestActions();
  const background = useThemeColor({}, 'groupedBackground');
  const muted = useThemeColor({}, 'mutedText');
  const chipBg = useThemeColor({ light: 'rgba(118,118,128,0.12)', dark: 'rgba(118,118,128,0.24)' }, 'card');

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

  const isOwner = book.ownerId === user?.uid;
  const distance =
    profile?.location && book.location
      ? haversineDistanceMiles(profile.location, book.location)
      : undefined;

  const hasOpenRequest = myRequest && myRequest.status !== 'Completed';
  const isSubmitting = status === 'submitting';
  const buttonDisabled = !book.available || isSubmitting || Boolean(hasOpenRequest);

  let buttonLabel = 'Request to Borrow';
  if (!book.available) buttonLabel = 'Currently Unavailable';
  else if (isSubmitting) buttonLabel = 'Sending Request…';
  else if (hasOpenRequest) buttonLabel = `Requested (${myRequest!.status})`;

  const handleRequest = async () => {
    const requestId = await createRequest(book);
    router.push(`/request/${requestId}`);
  };

  return (
    <>
      <Stack.Screen options={{ title: book.title }} />
      <ScrollView style={{ backgroundColor: background }} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.coverShadow}>
            <BookCover uri={book.coverUrl} width={180} />
          </View>
          <ThemedText type="title" style={styles.title}>
            {book.title}
          </ThemedText>
          <ThemedText style={[styles.author, { color: muted }]}>{book.author}</ThemedText>
          <View style={styles.chips}>
            {[book.genre, `Condition: ${book.condition}`].filter(Boolean).map((label) => (
              <View key={label} style={[styles.chip, { backgroundColor: chipBg }]}>
                <ThemedText style={styles.chipText}>{label}</ThemedText>
              </View>
            ))}
            <View style={[styles.chip, { backgroundColor: book.available ? '#2B8A3E1F' : chipBg }]}>
              <ThemedText style={[styles.chipText, { color: book.available ? '#2B8A3E' : muted }]}>
                {book.available ? 'Available' : 'Unavailable'}
              </ThemedText>
            </View>
          </View>
        </View>

        {book.description ? (
          <Card title="About this book">
            <ThemedText style={styles.description}>{book.description}</ThemedText>
          </Card>
        ) : null}

        <Card title="Owner">
          <Pressable
            disabled={isOwner}
            onPress={() => router.push(`/user/${book.ownerId}`)}
            style={({ pressed }) => [styles.ownerRow, pressed && styles.pressed]}>
            <Avatar name={book.ownerName} uid={book.ownerId} size={44} />
            <View style={styles.ownerText}>
              <ThemedText style={styles.ownerName}>{isOwner ? 'You' : book.ownerName}</ThemedText>
              <ThemedText style={[styles.ownerMeta, { color: muted }]}>
                {distance !== undefined ? `${formatDistanceMiles(distance)} · ` : ''}Meet in a public place
              </ThemedText>
            </View>
            {!isOwner && <IconSymbol name="chevron.right" size={14} color={muted} />}
          </Pressable>
        </Card>

        <View style={styles.actions}>
          {isOwner ? (
            <Button label="Edit Listing" icon="pencil" onPress={() => router.push(`/edit-book/${book.id}`)} />
          ) : (
            <>
              <Button label={buttonLabel} disabled={buttonDisabled} onPress={handleRequest} />
              {hasOpenRequest && (
                <Button label="View request" outline onPress={() => router.push(`/request/${myRequest!.id}`)} />
              )}
            </>
          )}
        </View>
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
  content: { padding: 16, paddingBottom: 40, gap: 24 },
  hero: { alignItems: 'center', gap: 6, paddingTop: 8 },
  coverShadow: {
    marginBottom: 12,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  title: { textAlign: 'center', fontSize: 26, lineHeight: 32 },
  author: { fontSize: 17, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  chipText: { fontSize: 13, lineHeight: 17, fontWeight: '600' },
  description: { padding: 16, fontSize: 16, lineHeight: 23 },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  pressed: { opacity: 0.6 },
  ownerText: { flex: 1, gap: 2 },
  ownerName: { fontSize: 16, fontWeight: '600' },
  ownerMeta: { fontSize: 13 },
  actions: { gap: 10 },
});
