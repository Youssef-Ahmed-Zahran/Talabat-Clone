import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useUploadDocument } from '@features/onboarding/api/onboarding.api';
import { COLORS } from '@constants/theme';
import { getErrorMessage } from '@utils/error';
import type { DocumentType } from '@features/onboarding/types/onboarding.types';

interface DocConfig {
  type: DocumentType;
  label: string;
  description: string;
  required: boolean;
  icon: string;
}

const REQUIRED_DOCS: DocConfig[] = [
  { type: 'ID_FRONT',  label: 'ID — Front',  description: 'National ID front side', required: true,  icon: 'card-outline' },
  { type: 'ID_BACK',   label: 'ID — Back',   description: 'National ID back side',  required: true,  icon: 'card-outline' },
  { type: 'SELFIE',    label: 'Selfie',      description: 'Clear photo of your face', required: true, icon: 'camera-outline' },
];

const OPTIONAL_DOCS: DocConfig[] = [
  { type: 'LICENSE_FRONT',          label: 'License — Front',          description: "Driver's license front",         required: false, icon: 'document-outline' },
  { type: 'LICENSE_BACK',           label: 'License — Back',           description: "Driver's license back",          required: false, icon: 'document-outline' },
  { type: 'VEHICLE_LICENSE_FRONT',  label: 'Vehicle License — Front',  description: 'Vehicle registration front',     required: false, icon: 'document-text-outline' },
  { type: 'VEHICLE_LICENSE_BACK',   label: 'Vehicle License — Back',   description: 'Vehicle registration back',      required: false, icon: 'document-text-outline' },
  { type: 'CRIMINAL_RECORD',        label: 'Criminal Record',          description: 'Official criminal record clearance', required: false, icon: 'shield-checkmark-outline' },
];

export default function DocumentsScreen() {
  const router = useRouter();
  const { mutateAsync, isPending } = useUploadDocument();
  const [uploaded, setUploaded] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  const pickAndUpload = async (docType: DocumentType) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload documents.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert('Error', 'Could not read the image. Please try again.');
        return;
      }

      const mimeType = asset.mimeType ?? 'image/jpeg';
      const base64File = `data:${mimeType};base64,${asset.base64}`;

      setUploading(docType);
      await mutateAsync({ documentType: docType, file: base64File });

      setUploaded((prev) => ({ ...prev, [docType]: asset.uri }));
    } catch (err) {
      Alert.alert('Upload Failed', getErrorMessage(err));
    } finally {
      setUploading(null);
    }
  };

  const requiredUploadedCount = REQUIRED_DOCS.filter((d) => uploaded[d.type]).length;
  const allRequiredDone = requiredUploadedCount === REQUIRED_DOCS.length;

  const renderDocCard = (doc: DocConfig) => {
    const isUploaded = !!uploaded[doc.type];
    const isLoading = uploading === doc.type;

    return (
      <TouchableOpacity
        key={doc.type}
        onPress={() => pickAndUpload(doc.type)}
        disabled={isLoading}
        activeOpacity={0.8}
        className={`mb-3 rounded-xl border-2 overflow-hidden ${
          isUploaded ? 'border-success' : doc.required ? 'border-border' : 'border-dashed border-border'
        }`}
      >
        <View className="flex-row items-center px-4 py-3">
          {/* Preview or icon */}
          <View
            className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${
              isUploaded ? 'bg-success/10' : 'bg-surfaceAlt'
            }`}
          >
            {isUploaded ? (
              <Image
                source={{ uri: uploaded[doc.type] }}
                className="w-12 h-12 rounded-xl"
                resizeMode="cover"
              />
            ) : (
              <Ionicons
                name={doc.icon as any}
                size={22}
                color={isUploaded ? COLORS.success : COLORS.textSecondary}
              />
            )}
          </View>

          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-sm font-semibold text-textPrimary">{doc.label}</Text>
              {doc.required && (
                <View className="bg-danger/10 rounded-full px-2 py-0.5">
                  <Text className="text-danger text-xs font-semibold">Required</Text>
                </View>
              )}
            </View>
            <Text className="text-xs text-textSecondary mt-0.5">{doc.description}</Text>
          </View>

          {/* Status icon */}
          <View className="ml-2">
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : isUploaded ? (
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            ) : (
              <Ionicons name="cloud-upload-outline" size={24} color={COLORS.primary} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="px-6 pt-4 pb-3 border-b border-border flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-textPrimary">Upload Documents</Text>
          <Text className="text-sm text-textSecondary mt-0.5">Step 3 of 3</Text>
        </View>
        <View className="flex-row gap-2">
          <View className="w-2.5 h-2.5 rounded-full bg-primary" />
          <View className="w-2.5 h-2.5 rounded-full bg-primary" />
          <View className="w-2.5 h-2.5 rounded-full bg-primary" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Progress bar */}
        <View className="mb-5">
          <View className="flex-row justify-between mb-1.5">
            <Text className="text-sm text-textSecondary">Required documents</Text>
            <Text className="text-sm font-semibold text-textPrimary">
              {requiredUploadedCount}/{REQUIRED_DOCS.length}
            </Text>
          </View>
          <View className="h-2 bg-border rounded-full overflow-hidden">
            <View
              className="h-full bg-primary rounded-full"
              style={{ width: `${(requiredUploadedCount / REQUIRED_DOCS.length) * 100}%` }}
            />
          </View>
        </View>

        {/* Required */}
        <Text className="text-xs font-semibold text-textTertiary uppercase tracking-widest mb-3">
          Required Documents
        </Text>
        {REQUIRED_DOCS.map(renderDocCard)}

        {/* Optional */}
        <Text className="text-xs font-semibold text-textTertiary uppercase tracking-widest mt-5 mb-3">
          Optional Documents
        </Text>
        <Text className="text-sm text-textSecondary mb-3">
          Upload these to speed up your verification process.
        </Text>
        {OPTIONAL_DOCS.map(renderDocCard)}

        {/* Tip */}
        <View className="bg-surfaceAlt border border-border rounded-xl px-4 py-3 mt-4 mb-8">
          <Text className="text-xs text-textSecondary leading-5">
            💡 Make sure photos are clear, well-lit, and all corners of the document are visible.
          </Text>
        </View>

        {/* Continue button */}
        <TouchableOpacity
          className={`rounded-xl h-14 items-center justify-center ${
            allRequiredDone ? 'bg-primary' : 'bg-border'
          }`}
          onPress={() => {
            if (!allRequiredDone) {
              Alert.alert(
                'Missing Documents',
                'Please upload all required documents before continuing.'
              );
              return;
            }
            router.replace('/onboarding/status');
          }}
          activeOpacity={0.85}
        >
          <Text className={`font-semibold text-base ${allRequiredDone ? 'text-white' : 'text-textSecondary'}`}>
            {allRequiredDone ? 'Finish & Submit' : `Upload ${REQUIRED_DOCS.length - requiredUploadedCount} more required`}
          </Text>
        </TouchableOpacity>

        {/* Skip optional */}
        {allRequiredDone && (
          <TouchableOpacity
            className="items-center mt-4"
            onPress={() => router.replace('/onboarding/status')}
          >
            <Text className="text-textSecondary text-sm">
              Skip optional documents for now
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
