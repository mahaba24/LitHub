import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACCENT_COLOR } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useRequest } from '@/hooks/use-requests';
import { useReviewForRequest, useSubmitReview } from '@/hooks/use-reviews';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { request, loading: requestLoading } = useRequest(id);
  const { review: existingReview, loading: reviewLoading } = useReviewForRequest(id, user?.uid);
  const { status, submitReview } = useSubmitReview();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const tint = ACCENT_COLOR;
  const textColor = useThemeColor({}, 'text');

  const loading = requestLoading || reviewLoading;

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Loading…</ThemedText>
      </ThemedView>
    );
  }

  if (!request) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle">Request not found</ThemedText>
      </ThemedView>
    );
  }

  const isBorrower = user?.uid === request.borrowerId;
  const isLender = user?.uid === request.lenderId;

  if (!isBorrower && !isLender) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle">You&apos;re not part of this exchange</ThemedText>
      </ThemedView>
    );
  }

  if (request.status !== 'Completed') {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle">This exchange isn&apos;t complete yet</ThemedText>
        <ThemedText style={styles.hint}>You can leave a review once the book has been returned.</ThemedText>
      </ThemedView>
    );
  }

  const revieweeId = isBorrower ? request.lenderId : request.borrowerId;
  const revieweeName = isBorrower ? request.lenderName : request.borrowerName;

  if (existingReview) {
    return (
      <>
        <Stack.Screen options={{ title: 'Leave a Review' }} />
        <ThemedView style={styles.container}>
          <ThemedText type="subtitle">You already reviewed this exchange</ThemedText>
          <StarRow rating={existingReview.rating} onRate={undefined} />
          {existingReview.comment ? <ThemedText>{existingReview.comment}</ThemedText> : null}
        </ThemedView>
      </>
    );
  }

  const handleSubmit = async () => {
    if (rating < 1) return;
    await submitReview(request, revieweeId, rating, comment.trim());
    router.back();
  };

  const isSubmitting = status === 'submitting';

  return (
    <>
      <Stack.Screen options={{ title: 'Leave a Review' }} />
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle">{request.bookTitle}</ThemedText>
        <ThemedText style={styles.hint}>
          How was your exchange with <ThemedText type="defaultSemiBold">{revieweeName}</ThemedText>?
        </ThemedText>

        <StarRow rating={rating} onRate={setRating} />

        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Add a comment (optional)"
          placeholderTextColor="#687076"
          multiline
          numberOfLines={4}
          style={[styles.input, { color: textColor }]}
        />

        <Pressable
          accessibilityRole="button"
          disabled={rating < 1 || isSubmitting}
          onPress={handleSubmit}
          style={[
            styles.button,
            { backgroundColor: tint },
            (rating < 1 || isSubmitting) && styles.buttonDisabled,
          ]}>
          <ThemedText style={styles.buttonText} type="defaultSemiBold">
            {isSubmitting ? 'Submitting…' : 'Submit Review'}
          </ThemedText>
        </Pressable>
      </ThemedView>
    </>
  );
}

function StarRow({ rating, onRate }: { rating: number; onRate?: (value: number) => void }) {
  return (
    <ThemedView style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Pressable
          key={value}
          disabled={!onRate}
          accessibilityRole="button"
          accessibilityLabel={`${value} star${value === 1 ? '' : 's'}`}
          onPress={() => onRate?.(value)}
          hitSlop={4}>
          <MaterialIcons
            name={value <= rating ? 'star' : 'star-border'}
            size={36}
            color={value <= rating ? '#f5a623' : '#687076'}
          />
        </Pressable>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  hint: {
    opacity: 0.7,
  },
  starRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#687076',
    borderRadius: 8,
    padding: 12,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
  },
});
