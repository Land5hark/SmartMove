import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { useAuth } from "../lib/auth-context";
import { listBoxes } from "../lib/boxes";
import type { Box } from "../types";

export default function HomeScreen() {
  const { configured, loading, user, signIn, signOut, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [isLoadingBoxes, setIsLoadingBoxes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBoxes = useCallback(async () => {
    if (!user) return;

    setIsLoadingBoxes(true);
    setError(null);
    try {
      setBoxes(await listBoxes(user.uid));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load boxes.",
      );
    } finally {
      setIsLoadingBoxes(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadBoxes();
    }, [loadBoxes]),
  );

  const submitAuth = async (mode: "sign-in" | "sign-up") => {
    setError(null);
    try {
      if (mode === "sign-up") {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Authentication failed.",
      );
    }
  };

  if (loading) {
    return (
      <Centered>
        <ActivityIndicator />
      </Centered>
    );
  }

  if (!configured) {
    return (
      <Centered>
        <Text selectable style={{ color: "#b91c1c", textAlign: "center" }}>
          Firebase is not configured. Set EXPO_PUBLIC_FIREBASE_* variables.
        </Text>
      </Centered>
    );
  }

  if (!user) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, gap: 14 }}
      >
        <Text style={{ fontSize: 28, fontWeight: "700" }}>SmartMove</Text>
        <Text style={{ color: "#475569" }}>
          Sign in to sync your boxes across web and Android.
        </Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          style={inputStyle}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Password"
          secureTextEntry
          style={inputStyle}
          value={password}
          onChangeText={setPassword}
        />
        {error ? (
          <Text selectable style={{ color: "#b91c1c" }}>
            {error}
          </Text>
        ) : null}
        <Pressable
          style={buttonStyle}
          onPress={() => void submitAuth("sign-in")}
        >
          <Text style={buttonTextStyle}>Sign In</Text>
        </Pressable>
        <Pressable
          style={secondaryButtonStyle}
          onPress={() => void submitAuth("sign-up")}
        >
          <Text style={{ color: "#0f172a", fontWeight: "600" }}>
            Create Account
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 20, gap: 14 }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View>
          <Text style={{ fontSize: 28, fontWeight: "700" }}>My Boxes</Text>
          <Text selectable style={{ color: "#64748b" }}>
            {user.email}
          </Text>
        </View>
        <Pressable style={secondaryButtonStyle} onPress={() => void signOut()}>
          <Text style={{ fontWeight: "600" }}>Sign Out</Text>
        </Pressable>
      </View>
      <Link href="/add-box" asChild>
        <Pressable style={buttonStyle}>
          <Text style={buttonTextStyle}>Add Box</Text>
        </Pressable>
      </Link>
      {error ? (
        <Text selectable style={{ color: "#b91c1c" }}>
          {error}
        </Text>
      ) : null}
      {isLoadingBoxes ? <ActivityIndicator /> : null}
      {boxes.length === 0 && !isLoadingBoxes ? (
        <Text style={{ color: "#64748b" }}>No boxes yet.</Text>
      ) : (
        boxes.map((box) => (
          <Link key={box.id} href={`/box/${box.id}`} asChild>
            <Pressable style={cardStyle}>
              <Text selectable style={{ fontSize: 18, fontWeight: "700" }}>
                Box #{box.id.slice(0, 8)}
              </Text>
              <Text selectable style={{ color: "#475569" }}>
                {box.assignedRoom || "No room assigned"}
              </Text>
              <Text style={{ color: "#64748b" }}>
                {box.aiGeneratedTags?.length || 0} tags
              </Text>
            </Pressable>
          </Link>
        ))
      )}
    </ScrollView>
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

const inputStyle = {
  borderWidth: 1,
  borderColor: "#cbd5e1",
  borderRadius: 8,
  padding: 12,
  fontSize: 16,
};

const buttonStyle = {
  alignItems: "center" as const,
  backgroundColor: "#0f172a",
  borderRadius: 8,
  padding: 14,
};

const secondaryButtonStyle = {
  alignItems: "center" as const,
  borderColor: "#cbd5e1",
  borderRadius: 8,
  borderWidth: 1,
  padding: 12,
};

const buttonTextStyle = {
  color: "white",
  fontWeight: "700" as const,
};

const cardStyle = {
  borderColor: "#e2e8f0",
  borderRadius: 8,
  borderWidth: 1,
  gap: 6,
  padding: 14,
};
