import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@src/constants/theme';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 justify-center items-center bg-[#F5F5F5] p-10">
          <Ionicons name="alert-circle-outline" size={56} color={COLORS.error} />
          <Text className="text-xl font-bold text-textPrimary mt-4 mb-1 text-center">
            Oops! Something went wrong
          </Text>
          <Text className="text-sm text-textSecondary text-center mb-8">
            {this.state.error?.message || 'An unexpected error occurred while loading this screen.'}
          </Text>
          <TouchableOpacity
            className="bg-primary px-8 h-12 rounded-xl justify-center items-center"
            onPress={this.handleRetry}
          >
            <Text className="text-white text-sm font-bold">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
