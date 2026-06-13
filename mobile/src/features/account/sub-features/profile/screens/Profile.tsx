import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useProfile, useUpdateProfile } from "../api/user.api";
import { getErrorMessage } from "@src/utils/error";
import { Loader } from "@src/components/loader/Loader";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "@src/constants/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [editing, setEditing] = useState(false);

  React.useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile.mutate(
      { fullName, phone: phone || undefined },
      {
        onSuccess: () => {
          setEditing(false);
          Alert.alert("Success", "Profile updated successfully!");
        },
        onError: (err) => Alert.alert("Error", getErrorMessage(err)),
      },
    );
  };

  if (isLoading) return <Loader message="Fetching your profile..." />;

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]" edges={["top"]}>
      <StatusBar style="dark" />
      <View className="flex-row items-center px-4 py-4 bg-white border-b border-border/40">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-textPrimary">My Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, alignItems: "center" }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Avatar */}
        <View className="items-center mb-10">
          <View className="w-32 h-32 rounded-[48px] bg-primary items-center justify-center shadow-2xl shadow-primary/30">
            <Text className="text-5xl font-black text-white">
              {profile?.fullName?.charAt(0)?.toUpperCase() || "U"}
            </Text>
          </View>
          <Text className="text-xl font-black text-textPrimary mt-6 tracking-tight">
            {profile?.fullName || "User"}
          </Text>
          <Text className="text-sm font-medium text-textTertiary mt-1">
            Joined{" "}
            {new Date(profile?.createdAt || Date.now()).toLocaleDateString([], {
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>

        {/* Form Fields */}
        <View className="w-full gap-y-6">
          <View>
            <Text className="text-xs font-black text-textTertiary uppercase tracking-widest mb-2 ml-1">
              Full Name
            </Text>
            <TextInput
              className={`bg-surfaceAlt px-5 py-4 rounded-2xl text-base text-textPrimary border ${
                editing ? "border-primary/40 bg-white" : "border-border/20"
              }`}
              value={fullName}
              onChangeText={setFullName}
              editable={editing}
              placeholder="Enter your name"
            />
          </View>

          <View>
            <Text className="text-xs font-black text-textTertiary uppercase tracking-widest mb-2 ml-1">
              Email Address
            </Text>
            <TextInput
              className="bg-slate-50 px-5 py-4 rounded-2xl text-base text-slate-400 border border-border/10"
              value={profile?.email || ""}
              editable={false}
            />
          </View>

          <View>
            <Text className="text-xs font-black text-textTertiary uppercase tracking-widest mb-2 ml-1">
              Phone Number
            </Text>
            <TextInput
              className={`bg-surfaceAlt px-5 py-4 rounded-2xl text-base text-textPrimary border ${
                editing ? "border-primary/40 bg-white" : "border-border/20"
              }`}
              value={phone}
              onChangeText={setPhone}
              editable={editing}
              keyboardType="phone-pad"
              placeholder="Enter your phone"
            />
          </View>

          {editing ? (
            <View className="flex-row gap-x-4 mt-4">
              <TouchableOpacity
                className="flex-1 bg-surfaceAlt h-14 rounded-2xl justify-center items-center border border-border/40"
                onPress={() => setEditing(false)}
              >
                <Text className="text-base font-bold text-textPrimary">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-[2] bg-primary h-14 rounded-2xl justify-center items-center shadow-lg shadow-primary/30"
                onPress={handleSave}
              >
                <Text className="text-base font-black text-white">
                  Save Changes
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="w-full bg-primary/10 h-14 rounded-2xl justify-center items-center border border-primary/20 mt-4"
              onPress={() => setEditing(true)}
            >
              <Text className="text-base font-black text-primary">
                Edit Profile Details
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="mt-12 opacity-40">
          <Text className="text-[10px] font-black text-textTertiary uppercase tracking-[3px]">
            talabat security
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
