import React, { Component, type ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@constants/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-surface px-8">
          <View className="w-16 h-16 rounded-full bg-dangerLight items-center justify-center mb-5">
            <Ionicons name="warning-outline" size={32} color={COLORS.danger} />
          </View>
          <Text className="text-xl font-bold text-textPrimary text-center mb-2">
            Something went wrong
          </Text>
          <Text className="text-sm text-textSecondary text-center mb-8" numberOfLines={3}>
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </Text>
          <TouchableOpacity
            className="bg-primary rounded-xl px-8 h-12 items-center justify-center"
            onPress={this.handleReset}
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
