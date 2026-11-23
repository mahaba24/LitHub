// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  magnifyingglass: 'search',
  'books.vertical.fill': 'menu-book',
  'person.fill': 'person',
  'trophy.fill': 'emoji-events',
  'arrow.left.arrow.right': 'swap-horiz',
  'bubble.left.and.bubble.right.fill': 'forum',
  'location.fill': 'location-on',
  'rectangle.portrait.and.arrow.right': 'logout',
  'star.fill': 'star',
  star: 'star-border',
  'star.leadinghalf.filled': 'star-half',
  'person.2.fill': 'people',
  'person.badge.plus': 'person-add',
  checkmark: 'check',
  plus: 'add',
  'book.fill': 'book',
  'checkmark.seal.fill': 'verified',
  'text.bubble.fill': 'rate-review',
  pencil: 'edit',
  trash: 'delete-outline',
  'mappin.and.ellipse': 'place',
  calendar: 'event',
  'hourglass': 'hourglass-empty',
  'hand.raised.fill': 'privacy-tip',
  'exclamationmark.bubble.fill': 'report',
  'nosign': 'block',
  'ellipsis.circle': 'more-horiz',
  'person.crop.circle': 'account-circle',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
