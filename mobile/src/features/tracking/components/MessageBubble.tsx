import React from "react";
import { View, Text } from "react-native";

interface MessageBubbleProps {
  body: string;
  createdAt: string;
  isMe: boolean;
}

export function MessageBubble({ body, createdAt, isMe }: MessageBubbleProps) {
  return (
    <View
      className={`max-w-[80%] px-4 py-3 mb-3 rounded-2xl ${
        isMe
          ? "bg-primary self-end rounded-br-sm"
          : "bg-white self-start rounded-bl-sm border border-border/40"
      }`}
    >
      <Text className={`text-sm leading-relaxed ${isMe ? "text-white" : "text-textPrimary"}`}>
        {body}
      </Text>
      <Text
        className={`text-[10px] mt-1 self-end ${isMe ? "text-white/60" : "text-textTertiary"}`}
      >
        {new Date(createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );
}
