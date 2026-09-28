import { StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

const STAR_COLOR = '#F5A524';

/** Read-only 5-star display, rounding to the nearest half star. */
export function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  const empty = useThemeColor({ light: '#D1D5DB', dark: '#4B5058' }, 'mutedText');
  const halves = Math.round(rating * 2);

  return (
    <View style={styles.row} accessibilityLabel={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const name = halves >= star * 2 ? 'star.fill' : halves === star * 2 - 1 ? 'star.leadinghalf.filled' : 'star';
        return <IconSymbol key={star} name={name} size={size} color={name === 'star' ? empty : STAR_COLOR} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 1 },
});
