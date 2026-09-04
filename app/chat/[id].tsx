import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput } from 'react-native';

import { SafetyBanner } from '@/components/safety-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACCENT_COLOR } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useMessages, useSendMessage } from '@/hooks/use-messages';
import { useRequest } from '@/hooks/use-requests';
import type { ChatMessage } from '@/types/message';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { request, loading: loadingRequest } = useRequest(id);
  const { messages, loading: loadingMessages } = useMessages(id);
  const { sendMessage } = useSendMessage(id);
  const [text, setText] = useState('');
  const textColor = useThemeColor({}, 'text');
  const listRef = useRef<FlatList<ChatMessage>>(null);

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

  const handleSend = async () => {
    const toSend = text;
    setText('');
    await sendMessage(toSend);
  };

  return (
    <>
      <Stack.Screen options={{ title: counterpart }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <SafetyBanner />

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            !loadingMessages ? (
              <ThemedView style={styles.empty}>
                <ThemedText style={styles.emptyText}>
                  No messages yet — say hello about {request.bookTitle}.
                </ThemedText>
              </ThemedView>
            ) : null
          }
          renderItem={({ item }) => {
            const isMine = item.senderId === user?.uid;
            return (
              <ThemedView style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
                <ThemedView
                  style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  {!isMine && <ThemedText style={styles.senderName}>{item.senderName}</ThemedText>}
                  <ThemedText style={isMine ? styles.bubbleTextMine : undefined}>{item.text}</ThemedText>
                </ThemedView>
              </ThemedView>
            );
          }}
        />

        <ThemedView style={styles.inputRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message…"
            style={[styles.input, { color: textColor }]}
            multiline
          />
          <Pressable
            disabled={!text.trim()}
            onPress={handleSend}
            style={[styles.sendButton, { backgroundColor: ACCENT_COLOR }, !text.trim() && styles.sendButtonDisabled]}>
            <ThemedText style={styles.sendButtonText} type="defaultSemiBold">
              Send
            </ThemedText>
          </Pressable>
        </ThemedView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messages: {
    padding: 16,
    gap: 8,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyText: {
    opacity: 0.6,
    textAlign: 'center',
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bubbleTheirs: {
    backgroundColor: 'rgba(127,127,127,0.15)',
  },
  bubbleMine: {
    backgroundColor: ACCENT_COLOR,
  },
  bubbleTextMine: {
    color: '#fff',
  },
  senderName: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#687076',
  },
  input: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#687076',
    borderRadius: 8,
    padding: 12,
    maxHeight: 100,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
  },
});
