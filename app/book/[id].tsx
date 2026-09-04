import { Image } from 'expo-image';
import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACCENT_COLOR } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useBook } from '@/hooks/use-books';
import { useMyRequestForBook, useRequestActions } from '@/hooks/use-requests';
import { formatDistanceMiles, haversineDistanceMiles } from '@/lib/geo';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { book, loading } = useBook(id);
  const { user, profile } = useAuth();
  const { request: myRequest } = useMyRequestForBook(id);
  const { status, createRequest } = useRequestActions();
  const tint = ACCENT_COLOR;

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
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedView style={styles.coverContainer}>
          {book.coverUrl ? (
            <Image source={{ uri: book.coverUrl }} style={styles.cover} contentFit="cover" />
          ) : (
            <ThemedView style={styles.coverPlaceholder} />
          )}
        </ThemedView>

        <ThemedView style={styles.info}>
          <ThemedText type="title">{book.title}</ThemedText>
          <ThemedText type="subtitle" style={styles.author}>
            {book.author}
          </ThemedText>

          <ThemedView style={styles.metaRow}>
            <ThemedView style={styles.badge}>
              <ThemedText type="defaultSemiBold">{book.genre}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.badge}>
              <ThemedText type="defaultSemiBold">Condition: {book.condition}</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedText style={styles.description}>{book.description}</ThemedText>

          <ThemedText style={styles.owner}>
            Owned by <ThemedText type="defaultSemiBold">{book.ownerName}</ThemedText>
            {distance !== undefined ? ` · ${formatDistanceMiles(distance)}` : ''}
          </ThemedText>

          {isOwner ? (
            <Link href={`/edit-book/${book.id}`} asChild>
              <Pressable style={[styles.requestButton, { backgroundColor: tint }]}>
                <ThemedText style={styles.requestButtonText} type="defaultSemiBold">
                  Edit Listing
                </ThemedText>
              </Pressable>
            </Link>
          ) : (
            <>
              <Pressable
                accessibilityRole="button"
                disabled={buttonDisabled}
                onPress={handleRequest}
                style={[
                  styles.requestButton,
                  { backgroundColor: tint },
                  buttonDisabled ? styles.requestButtonDisabled : undefined,
                ]}>
                <ThemedText style={styles.requestButtonText} type="defaultSemiBold">
                  {buttonLabel}
                </ThemedText>
              </Pressable>

              {hasOpenRequest && (
                <Link href={`/request/${myRequest!.id}`} asChild>
                  <Pressable style={styles.negotiateLink}>
                    <ThemedText type="link">View request →</ThemedText>
                  </Pressable>
                </Link>
              )}
            </>
          )}
        </ThemedView>
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
    flexGrow: 1,
  },
  coverContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  cover: {
    width: 200,
    height: 300,
    borderRadius: 8,
  },
  coverPlaceholder: {
    width: 200,
    height: 300,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#687076',
  },
  info: {
    paddingHorizontal: 20,
    gap: 12,
  },
  author: {
    opacity: 0.7,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#687076',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  description: {
    lineHeight: 22,
  },
  owner: {
    opacity: 0.8,
  },
  requestButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  requestButtonDisabled: {
    opacity: 0.5,
  },
  requestButtonText: {
    color: '#fff',
  },
  negotiateLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});
