import { StyleSheet, View, type ViewProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

type Props = ViewProps & {
  /** Small uppercase label shown above the card, like an iOS grouped-list header. */
  title?: string;
  /** Muted helper text shown under the card. */
  footer?: string;
};

export function Card({ title, footer, style, children, ...rest }: Props) {
  const card = useThemeColor({}, 'card');
  const muted = useThemeColor({}, 'mutedText');

  return (
    <View style={styles.section}>
      {title && <ThemedText style={[styles.title, { color: muted }]}>{title}</ThemedText>}
      <View style={[styles.card, { backgroundColor: card }, style]} {...rest}>
        {children}
      </View>
      {footer && <ThemedText style={[styles.footer, { color: muted }]}>{footer}</ThemedText>}
    </View>
  );
}

/** Hairline between rows inside a Card, inset past the row icon. */
export function CardSeparator({ inset = 60 }: { inset?: number }) {
  const separator = useThemeColor({}, 'separator');
  return <View style={[styles.separator, { backgroundColor: separator, marginLeft: inset }]} />;
}

const styles = StyleSheet.create({
  section: { gap: 6 },
  title: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginLeft: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  footer: { fontSize: 13, lineHeight: 18, marginHorizontal: 16 },
  separator: { height: StyleSheet.hairlineWidth },
});
