import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, CardSeparator } from '@/components/ui/card';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { StarRating } from '@/components/ui/star-rating';
import { useReviewsReceived } from '@/hooks/use-reviews';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatDueDate } from '@/lib/dates';
import type { ReviewBucket } from '@/types/review';

const BUCKET_LABELS: Record<ReviewBucket, string> = {
  borrower: 'As borrower',
  lender: 'As lender',
  other: 'Other',
};

const EMPTY_TEXT: Record<ReviewBucket, string> = {
  borrower: 'No reviews from lenders yet.',
  lender: 'No reviews from borrowers yet.',
  other: '',
};

/**
 * Reviews received, split by the role the person played. "Other" holds reviews
 * written before roles were recorded and only appears when there are some.
 */
export function ReviewsSection({ uid }: { uid: string }) {
  const { groups, loading } = useReviewsReceived(uid);
  const [bucket, setBucket] = useState<ReviewBucket>('borrower');
  const muted = useThemeColor({}, 'mutedText');

  const buckets: ReviewBucket[] = groups.other.count > 0 ? ['borrower', 'lender', 'other'] : ['borrower', 'lender'];
  const active = groups[bucket];

  return (
    <View style={styles.section}>
      <ThemedText style={[styles.title, { color: muted }]}>REVIEWS</ThemedText>

      <SegmentedControl
        options={buckets.map((b) => ({ value: b, label: `${BUCKET_LABELS[b]} (${groups[b].count})` }))}
        value={bucket}
        onChange={setBucket}
      />

      <Card>
        <View style={styles.summary}>
          <ThemedText style={styles.average}>{active.count ? active.averageRating.toFixed(1) : '–'}</ThemedText>
          <View style={styles.summaryText}>
            <StarRating rating={active.averageRating} size={16} />
            <ThemedText style={[styles.summaryCount, { color: muted }]}>
              {active.count} review{active.count === 1 ? '' : 's'}
              {bucket === 'other' ? ' · from before roles were tracked' : ''}
            </ThemedText>
          </View>
        </View>

        {!loading && active.count === 0 && EMPTY_TEXT[bucket] !== '' && (
          <>
            <CardSeparator inset={16} />
            <ThemedText style={[styles.empty, { color: muted }]}>{EMPTY_TEXT[bucket]}</ThemedText>
          </>
        )}

        {active.reviews.map((review) => (
          <View key={review.id}>
            <CardSeparator inset={16} />
            <View style={styles.review}>
              <View style={styles.reviewTop}>
                <ThemedText style={styles.reviewer} numberOfLines={1}>
                  {review.reviewerName}
                </ThemedText>
                <StarRating rating={review.rating} size={12} />
              </View>
              <ThemedText style={[styles.reviewMeta, { color: muted }]} numberOfLines={1}>
                {review.bookTitle} · {formatDueDate(review.createdAt)}
              </ThemedText>
              {review.comment ? <ThemedText style={styles.comment}>{review.comment}</ThemedText> : null}
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  title: { fontSize: 13, lineHeight: 18, fontWeight: '600', letterSpacing: 0.6, marginLeft: 16 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  average: { fontSize: 36, lineHeight: 42, fontWeight: '700' },
  summaryText: { gap: 4 },
  summaryCount: { fontSize: 13, lineHeight: 17 },
  empty: { padding: 16, fontSize: 14 },
  review: { paddingHorizontal: 16, paddingVertical: 12, gap: 2 },
  reviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  reviewer: { flex: 1, fontWeight: '600' },
  reviewMeta: { fontSize: 12, lineHeight: 16 },
  comment: { marginTop: 4, fontSize: 15, lineHeight: 21 },
});
