import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useAuth } from "../../lib/auth-context";
import { boxUrl, deleteBox, getBox } from "../../lib/boxes";
import type { Box } from "../../types";

export default function BoxDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [box, setBox] = useState<Box | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const loadBox = useCallback(async () => {
    if (!user || !id) return;
    setError(null);
    try {
      setBox(await getBox(user.uid, id));
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Could not load box.",
      );
    }
  }, [id, user]);

  useFocusEffect(
    useCallback(() => {
      void loadBox();
    }, [loadBox]),
  );

  const confirmDelete = () => {
    if (!user || !id) return;
    Alert.alert("Delete box?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteBox(user.uid, id);
          router.replace("/");
        },
      },
    ]);
  };

  if (box === undefined) {
    return (
      <Centered>
        <ActivityIndicator />
      </Centered>
    );
  }

  if (!box) {
    return (
      <Centered>
        <Text selectable>Box not found.</Text>
      </Centered>
    );
  }

  const url = boxUrl(box.id);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 20, gap: 16 }}
    >
      <Text selectable style={{ fontSize: 28, fontWeight: "700" }}>
        Box #{box.id.slice(0, 8)}
      </Text>
      {box.photoUrl ? (
        <Image
          source={{ uri: box.photoUrl }}
          style={{ width: "100%", height: 240, borderRadius: 8 }}
        />
      ) : null}
      <View
        style={{
          alignItems: "center",
          backgroundColor: "white",
          borderRadius: 8,
          padding: 16,
        }}
      >
        <QRCode value={url} size={180} />
        <Text selectable style={{ marginTop: 10, color: "#475569" }}>
          {url}
        </Text>
      </View>
      <Info label="Room" value={box.assignedRoom || "Not assigned"} />
      <Info label="Notes" value={box.manualDescription || "No notes"} />
      <Info
        label="Tags"
        value={
          box.aiGeneratedTags?.length
            ? box.aiGeneratedTags.join(", ")
            : "No AI tags"
        }
      />
      {error ? (
        <Text selectable style={{ color: "#b91c1c" }}>
          {error}
        </Text>
      ) : null}
      <Pressable style={deleteButtonStyle} onPress={confirmDelete}>
        <Text style={{ color: "white", fontWeight: "700" }}>Delete Box</Text>
      </Pressable>
    </ScrollView>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: "#64748b", fontWeight: "600" }}>{label}</Text>
      <Text selectable style={{ color: "#0f172a", fontSize: 17 }}>
        {value}
      </Text>
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      {children}
    </View>
  );
}

const deleteButtonStyle = {
  alignItems: "center" as const,
  backgroundColor: "#b91c1c",
  borderRadius: 8,
  padding: 14,
};
