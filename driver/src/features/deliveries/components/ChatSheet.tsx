import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '@store/uiStore';
import { useAuthStore } from '@store/authStore';
import { chatSocket, connectSocket } from '@config/socket';
import { COLORS } from '@constants/theme';

interface Message {
  id: string;
  senderType: 'USER' | 'DRIVER';
  senderId: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export function ChatSheet() {
  const driver = useAuthStore((s) => s.driver);
  const isOpen = useUIStore((s) => s.isChatSheetOpen);
  const chatOrderId = useUIStore((s) => s.chatOrderId);
  const setChatSheetOpen = useUIStore((s) => s.setChatSheetOpen);
  const setChatOrderId = useUIStore((s) => s.setChatOrderId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [typingVisible, setTypingVisible] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(600)).current;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  // Slide animation
  useEffect(() => {
    if (isOpen) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen]);

  // Connect & join conversation
  useEffect(() => {
    if (!isOpen || !chatOrderId) return;

    connectSocket(chatSocket).then(() => {
      chatSocket.emit(
        'chat:join',
        { orderId: chatOrderId },
        (ack: { success: boolean; conversationId?: string; messages?: Message[] }) => {
          if (ack.success) {
            setMessages(ack.messages ?? []);
            setIsJoined(true);
            scrollToBottom();
            // Mark messages as read
            chatSocket.emit('chat:read', { orderId: chatOrderId }, () => {});
          }
        }
      );
    });

    // Listen for incoming messages
    const handleMessage = ({ message }: { orderId: string; message: Message }) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      scrollToBottom();
      // Mark as read immediately
      chatSocket.emit('chat:read', { orderId: chatOrderId }, () => {});
    };

    // Listen for typing indicator
    const handleTyping = ({ isTyping }: { isTyping: boolean; role: string }) => {
      setTypingVisible(isTyping);
      if (isTyping) {
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTypingVisible(false), 3000);
      }
    };

    chatSocket.on('chat:message', handleMessage);
    chatSocket.on('chat:typing', handleTyping);

    return () => {
      chatSocket.off('chat:message', handleMessage);
      chatSocket.off('chat:typing', handleTyping);
    };
  }, [isOpen, chatOrderId]);

  const handleClose = () => {
    setChatSheetOpen(false);
    setChatOrderId(null);
    setMessages([]);
    setIsJoined(false);
    setInputText('');
  };

  const sendMessage = useCallback(async () => {
    const body = inputText.trim();
    if (!body || !chatOrderId || !isJoined) return;
    setIsSending(true);
    setInputText('');
    chatSocket.emit(
      'chat:message',
      { orderId: chatOrderId, body },
      (ack: { success: boolean; message?: Message }) => {
        setIsSending(false);
        if (ack.success && ack.message) {
          setMessages((prev) => {
            if (prev.find((m) => m.id === ack.message!.id)) return prev;
            return [...prev, ack.message!];
          });
          scrollToBottom();
        }
      }
    );
  }, [inputText, chatOrderId, isJoined, scrollToBottom]);

  const handleTypingChange = (text: string) => {
    setInputText(text);
    if (!chatOrderId) return;
    chatSocket.emit('chat:typing', { orderId: chatOrderId, isTyping: true });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isDriver = item.senderType === 'DRIVER';
    return (
      <View className={`mx-4 mb-2 max-w-xs ${isDriver ? 'self-end' : 'self-start'}`}>
        <View
          className={`px-4 py-2.5 rounded-2xl ${
            isDriver ? 'bg-primary rounded-br-sm' : 'bg-surfaceAlt border border-border rounded-bl-sm'
          }`}
        >
          <Text className={`text-sm ${isDriver ? 'text-white' : 'text-textPrimary'}`}>
            {item.body}
          </Text>
        </View>
        <Text className={`text-xs text-textTertiary mt-1 ${isDriver ? 'text-right' : 'text-left'}`}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  if (!isOpen) return null;

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/40 justify-end">
        <Animated.View
          style={{ transform: [{ translateY: slideAnim }], height: '75%' }}
          className="bg-surface rounded-t-3xl overflow-hidden"
        >
          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {/* Header */}
            <View className="flex-row items-center px-5 py-4 border-b border-border">
              <View className="w-2.5 h-2.5 rounded-full bg-success mr-2" />
              <Text className="flex-1 text-base font-bold text-textPrimary">
                Chat with Customer
              </Text>
              <TouchableOpacity
                className="w-8 h-8 rounded-full bg-surfaceAlt items-center justify-center"
                onPress={handleClose}
              >
                <Ionicons name="close" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              className="flex-1 pt-4"
              showsVerticalScrollIndicator={false}
              onContentSizeChange={scrollToBottom}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center py-10">
                  <Ionicons name="chatbubbles-outline" size={40} color={COLORS.textTertiary} />
                  <Text className="text-textTertiary text-sm mt-2">
                    {isJoined ? 'No messages yet. Say hello!' : 'Connecting...'}
                  </Text>
                </View>
              }
            />

            {/* Typing indicator */}
            {typingVisible && (
              <View className="px-5 py-1">
                <Text className="text-xs text-textTertiary italic">Customer is typing...</Text>
              </View>
            )}

            {/* Input */}
            <View className="flex-row items-center px-4 py-3 border-t border-border gap-3">
              <TextInput
                className="flex-1 bg-surfaceAlt rounded-2xl px-4 py-3 text-textPrimary text-sm"
                placeholder="Type a message..."
                placeholderTextColor={COLORS.textTertiary}
                value={inputText}
                onChangeText={handleTypingChange}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity
                className="w-11 h-11 rounded-full bg-primary items-center justify-center"
                onPress={sendMessage}
                disabled={isSending || !inputText.trim()}
                activeOpacity={0.85}
              >
                {isSending ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Ionicons name="send" size={18} color={COLORS.white} />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}
