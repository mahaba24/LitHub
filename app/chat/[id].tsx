import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar } from '@/components/avatar';
import { SafetyBanner } from '@/components/safety-banner';
import { useUserSafety } from '@/components/safety/use-user-safety';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Card, CardSeparator } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { NavRow } from '@/components/ui/nav-row';
import { ACCENT_COLOR } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { isPermissionDenied } from '@/hooks/use-blocks';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMessages, useSendMessage } from '@/hooks/use-messages';
import { useRequest } from '@/hooks/use-requests';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { ChatMessage } from '@/types/message';

/** Consecutive messages from the same sender within this window render as one group. */
const GROUP_WINDOW_MS = 5 * 60 * 1000;

function formatTime(millis: number) {
  return new Date(millis).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function isSameGroup(a: ChatMessage | undefined, b: ChatMessage | undefined) {
  return !!a && !!b && a.senderId === b.senderId && Math.abs(b.createdAt - a.createdAt) < GROUP_WINDOW_MS;
}

type BubbleProps = {
  message: ChatMessage;
  isMine: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  animate: boolean;
  theirColor: string;
};

function MessageBubble({ message, isMine, isFirstInGroup, isLastInGroup, animate, theirColor }: BubbleProps) {
  // Rounded "pill" bubbles; the corner on the sender's side tightens inside a
  // group and forms a small tail on the last bubble, like iMessage/WhatsApp.
  const senderSideCorners = isMine
    ? { borderTopRightRadius: isFirstInGroup ? 20 : 6, borderBottomRightRadius: isLastInGroup ? 4 : 6 }
    : { borderTopLeftRadius: isFirstInGroup ? 20 : 6, borderBottomLeftRadius: isLastInGroup ? 4 : 6 };

  return (
    <Animated.View
      entering={animate ? FadeInDown.springify().damping(16).mass(0.7) : undefined}
      style={[styles.bubbleRow, isMine && styles.bubbleRowMine, { marginTop: isFirstInGroup ? 10 : 2 }]}>
      <View
        style={[
          styles.bubble,
          senderSideCorners,
          isMine ? styles.bubbleMine : { backgroundColor: theirColor },
        ]}>
        <ThemedText style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{message.text}</ThemedText>
      </View>
      {isLastInGroup && (
        <ThemedText style={[styles.timestamp, isMine && styles.timestampMine]}>
          {formatTime(message.createdAt)}
        </ThemedText>
      )}
    </Animated.View>
  );
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { request, loading: loadingRequest } = useRequest(id);
  const { messages, loading: loadingMessages } = useMessages(id);
  const { sendMessage } = useSendMessage(id);
  const [text, setText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const counterpartIdOrUndefined = request
    ? user?.uid === request.lenderId
      ? request.borrowerId
      : request.lenderId
    : undefined;
  const counterpartName = request
    ? user?.uid === request.lenderId
      ? request.borrowerName
      : request.lenderName
    : '';
  const safety = useUserSafety({
    uid: counterpartIdOrUndefined,
    name: counterpartName,
    source: 'chat',
    requestId: id,
  });
  const muted = useThemeColor({}, 'mutedText');
  const textColor = useThemeColor({}, 'text');
  const colorScheme = useColorScheme();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  // Only messages that arrive while the screen is open animate in; history
  // loaded on open appears instantly instead of cascading.
  const mountedAt = useRef(Date.now());

  const theirBubbleColor = colorScheme === 'dark' ? '#2C2C2E' : '#E9E9EB';
  const inputBackground = colorScheme === 'dark' ? '#1F2123' : '#F2F2F4';

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  if (loadingRequest) {
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

  const isLender = user?.uid === request.lenderId;
  const counterpart = isLender ? request.borrowerName : request.lenderName;
  const counterpartId = isLender ? request.borrowerId : request.lenderId;
  const canSend = text.trim().length > 0;

  // iOS can't present an Alert or another Modal while this sheet is still
  // animating out, so wait for the slide-down before the next step.
  const closeMenuThen = (next: () => void) => {
    setMenuOpen(false);
    setTimeout(next, Platform.OS === 'ios' ? 350 : 0);
  };

  const handleSend = async () => {
    const toSend = text;
    setText('');
    setSendError(null);
    try {
      await sendMessage(toSend);
    } catch (error) {
      console.warn('sendMessage failed', error);
      // Give the text back so a failed send isn't silently lost.
      setText((current) => current || toSend);
      // A block on either side surfaces as permission-denied. Don't reveal
      // whether *they* blocked *you*.
      setSendError(
        isPermissionDenied(error)
          ? `You can’t message ${counterpart} right now.`
          : error instanceof Error
            ? error.message
            : 'Message failed to send'
      );
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: counterpart,
          // Tapping the name/avatar in the header opens their profile.
          headerTitle: () => (
            <Pressable
              onPress={() => router.push(`/user/${counterpartId}`)}
              accessibilityRole="button"
              accessibilityLabel={`View ${counterpart}'s profile`}
              style={styles.headerTitle}>
              <Avatar name={counterpart} uid={counterpartId} size={28} />
              <ThemedText type="defaultSemiBold" numberOfLines={1}>
                {counterpart}
              </ThemedText>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={() => setMenuOpen(true)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Options for ${counterpart}`}>
              <IconSymbol name="ellipsis.circle" size={24} color={ACCENT_COLOR} />
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <SafetyBanner />

        <ThemedView style={styles.flex}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messages}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            keyboardDismissMode="interactive"
            ListEmptyComponent={
              !loadingMessages ? (
                <View style={styles.empty}>
                  <ThemedText style={styles.emptyEmoji}>👋</ThemedText>
                  <ThemedText style={styles.emptyText}>
                    No messages yet — say hello about {request.bookTitle}.
                  </ThemedText>
                </View>
              ) : null
            }
            renderItem={({ item, index }) => (
              <MessageBubble
                message={item}
                isMine={item.senderId === user?.uid}
                isFirstInGroup={!isSameGroup(messages[index - 1], item)}
                isLastInGroup={!isSameGroup(item, messages[index + 1])}
                animate={item.createdAt >= mountedAt.current}
                theirColor={theirBubbleColor}
              />
            )}
          />
        </ThemedView>

        {sendError && (
          <ThemedText style={styles.sendError}>Couldn&apos;t send: {sendError}</ThemedText>
        )}
        {safety.isBlocked ? (
          <ThemedView style={styles.blockedBar}>
            <ThemedText style={[styles.blockedText, { color: muted }]}>
              You blocked {counterpart}. You can still read past messages.
            </ThemedText>
            <Button label="Unblock" outline disabled={safety.busy} onPress={safety.confirmAndUnblock} />
          </ThemedView>
        ) : (
        <ThemedView style={styles.inputRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message…"
            placeholderTextColor="#8E8E93"
            style={[styles.input, { color: textColor, backgroundColor: inputBackground }]}
            multiline
          />
          <Pressable
            disabled={!canSend}
            onPress={handleSend}
            accessibilityLabel="Send message"
            style={({ pressed }) => [
              styles.sendButton,
              !canSend && styles.sendButtonDisabled,
              pressed && styles.sendButtonPressed,
            ]}>
            <IconSymbol name="paperplane.fill" size={18} color="#fff" />
          </Pressable>
        </ThemedView>
        )}
      </KeyboardAvoidingView>

      <BottomSheet visible={menuOpen} onClose={() => setMenuOpen(false)} title={counterpart}>
        <Card>
          <NavRow
            icon="person.crop.circle"
            iconColor={ACCENT_COLOR}
            label="View profile"
            onPress={() => {
              setMenuOpen(false);
              router.push(`/user/${counterpartId}`);
            }}
          />
          <CardSeparator />
          <NavRow
            icon="exclamationmark.bubble.fill"
            iconColor="#FF9500"
            label={`Report ${counterpart}`}
            detail="Spam, inappropriate behaviour or an unsafe meetup"
            onPress={() => closeMenuThen(safety.openReport)}
          />
          <CardSeparator />
          <NavRow
            icon="nosign"
            iconColor="#FF3B30"
            label={safety.isBlocked ? `Unblock ${counterpart}` : `Block ${counterpart}`}
            detail={safety.isBlocked ? 'Allow requests and messages again' : 'Stop requests and messages both ways'}
            onPress={() => closeMenuThen(safety.isBlocked ? safety.confirmAndUnblock : safety.confirmAndBlock)}
          />
        </Card>
        <Button label="Cancel" outline onPress={() => setMenuOpen(false)} />
      </BottomSheet>
      {safety.reportSheet}
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  blockedBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 10,
  },
  blockedText: {
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messages: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 36,
    lineHeight: 44,
  },
  emptyText: {
    opacity: 0.6,
    textAlign: 'center',
  },
  bubbleRow: {
    alignItems: 'flex-start',
  },
  bubbleRowMine: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  bubbleMine: {
    backgroundColor: ACCENT_COLOR,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 21,
  },
  bubbleTextMine: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 11,
    lineHeight: 14,
    opacity: 0.5,
    marginTop: 3,
    marginHorizontal: 6,
  },
  timestampMine: {
    textAlign: 'right',
  },
  sendError: {
    color: '#c0392b',
    fontSize: 13,
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(127,127,127,0.3)',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT_COLOR,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonPressed: {
    transform: [{ scale: 0.9 }],
  },
});
