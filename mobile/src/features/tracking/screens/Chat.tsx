import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useChat } from "../hooks/useChat";
import { MessageBubble } from "../components/MessageBubble";
import { COLORS } from "@src/constants/theme";
import type { Message } from "@src/features/tracking/types/messaging.types";

export default function ChatScreen() {
  const { query, state, actions, refs, router } = useChat();

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderType === "USER" && item.senderId === query.userId;
    return (
      <MessageBubble body={item.body} createdAt={item.createdAt} isMe={isMe} />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]" edges={["top"]}>
      <StatusBar style="dark" />

      <View className="flex-row items-center px-4 py-4 bg-white border-b border-border/40">
        <TouchableOpacity onPress={router.navigateBack} className="mr-3">
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text className="text-lg font-bold text-textPrimary">
            Driver Chat
          </Text>
          <View className="flex-row items-center mt-0.5">
            <View
              className={`w-2 h-2 rounded-full mr-1.5 ${
                state.isConnecting
                  ? "bg-yellow-400"
                  : state.connectError
                    ? "bg-red-400"
                    : "bg-green-500"
              }`}
            />
            <Text className="text-xs font-medium text-textTertiary">
              {state.isConnecting
                ? "Connecting..."
                : state.connectError
                  ? "Disconnected"
                  : "Live"}
            </Text>
          </View>
        </View>
      </View>

      {state.isConnecting && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="text-sm text-textTertiary mt-3">
            Connecting to chat...
          </Text>
        </View>
      )}

      {!state.isConnecting && state.connectError && (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="warning-outline" size={48} color={COLORS.warning} />
          <Text className="text-base font-semibold text-textPrimary text-center mt-3">
            {state.connectError}
          </Text>
          <Text className="text-sm text-textTertiary mt-2 text-center">
            A driver may not have been assigned yet. Try again shortly.
          </Text>
        </View>
      )}

      {!state.isConnecting && !state.connectError && (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <FlatList
            ref={refs.flatListRef}
            data={query.messages}
            keyExtractor={(i) => i.id}
            renderItem={renderMessage}
            contentContainerStyle={{ padding: 16, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-16">
                <Ionicons
                  name="chatbubble-outline"
                  size={48}
                  color={COLORS.textTertiary}
                />
                <Text className="text-base font-semibold text-textPrimary mt-3">
                  Say hello!
                </Text>
                <Text className="text-sm text-textTertiary mt-1 text-center px-6">
                  Chat with your driver for delivery updates
                </Text>
              </View>
            }
            ListFooterComponent={
              state.isTyping ? (
                <View className="bg-white self-start rounded-2xl rounded-bl-sm px-4 py-2.5 mb-3 border border-border/20">
                  <Text className="text-textTertiary text-sm">
                    Driver is typing…
                  </Text>
                </View>
              ) : null
            }
          />

          <View className="flex-row items-end bg-white px-4 pt-3 pb-6 border-t border-border/40">
            <TextInput
              className="flex-1 bg-[#F5F5F5] rounded-xl px-4 py-3 text-sm text-textPrimary max-h-28 border border-border/40"
              value={state.text}
              onChangeText={actions.handleTyping}
              placeholder="Type your message..."
              placeholderTextColor={COLORS.textTertiary}
              multiline
            />
            <TouchableOpacity
              className={`w-11 h-11 rounded-xl items-center justify-center ml-3 ${
                !state.text.trim() || state.isSending
                  ? "bg-slate-200"
                  : "bg-primary"
              }`}
              onPress={actions.handleSend}
              disabled={!state.text.trim() || state.isSending}
            >
              {state.isSending ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons
                  name="send"
                  size={18}
                  color={
                    !state.text.trim() ? COLORS.textTertiary : COLORS.white
                  }
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
