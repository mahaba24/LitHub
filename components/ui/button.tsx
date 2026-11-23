import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ACCENT_COLOR } from '@/constants/theme';

const VARIANT_COLORS = {
  primary: ACCENT_COLOR,
  success: '#2B8A3E',
  destructive: '#E03131',
} as const;

type Props = {
  label: string;
  onPress?: () => void;
  variant?: keyof typeof VARIANT_COLORS;
  /** Tinted background + colored label instead of a solid fill. */
  outline?: boolean;
  icon?: ComponentProps<typeof IconSymbol>['name'];
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Rounded full-width action button used across detail screens. */
export function Button({ label, onPress, variant = 'primary', outline, icon, disabled, style }: Props) {
  const color = VARIANT_COLORS[variant];
  const fg = outline ? color : '#fff';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        outline ? { backgroundColor: `${color}1A` } : { backgroundColor: color },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      {icon && <IconSymbol name={icon} size={18} color={fg} />}
      <ThemedText style={[styles.label, { color: fg }]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
  label: { fontSize: 16, lineHeight: 21, fontWeight: '600' },
});
