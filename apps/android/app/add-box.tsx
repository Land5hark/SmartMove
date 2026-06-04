import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput } from 'react-native';
import { saveBox } from '../lib/boxes';
import { useAuth } from '../lib/auth-context';

export default function AddBoxScreen() {
  const { user } = useAuth();
  const [id, setId] = useState(() => Date.now().toString(36).slice(-8));
  const [manualDescription, setManualDescription] = useState('');
  const [assignedRoom, setAssignedRoom] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0]?.uri);
    }
  };

  const captureImage = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Camera permission is required to capture a box photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0]?.uri);
    }
  };

  const submit = async () => {
    if (!user) {
      router.replace('/');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const box = await saveBox(user.uid, { id, manualDescription, assignedRoom, photoUri });
      router.replace(`/box/${box.id}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save box.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 20, gap: 14 }}>
      <TextInput placeholder="Box ID" value={id} onChangeText={setId} style={inputStyle} />
      <TextInput
        placeholder="Room"
        value={assignedRoom}
        onChangeText={setAssignedRoom}
        style={inputStyle}
      />
      <TextInput
        multiline
        placeholder="Notes"
        value={manualDescription}
        onChangeText={setManualDescription}
        style={{ ...inputStyle, minHeight: 110, textAlignVertical: 'top' }}
      />
      {photoUri ? <Image source={{ uri: photoUri }} style={{ width: '100%', height: 220, borderRadius: 8 }} /> : null}
      <Pressable style={secondaryButtonStyle} onPress={() => void captureImage()}>
        <Text style={{ fontWeight: '600' }}>Take Photo</Text>
      </Pressable>
      <Pressable style={secondaryButtonStyle} onPress={() => void pickImage()}>
        <Text style={{ fontWeight: '600' }}>Choose Photo</Text>
      </Pressable>
      {error ? <Text selectable style={{ color: '#b91c1c' }}>{error}</Text> : null}
      <Pressable style={buttonStyle} onPress={() => void submit()} disabled={isSaving}>
        <Text style={buttonTextStyle}>{isSaving ? 'Saving...' : 'Save Box'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: '#cbd5e1',
  borderRadius: 8,
  padding: 12,
  fontSize: 16,
};

const buttonStyle = {
  alignItems: 'center' as const,
  backgroundColor: '#0f172a',
  borderRadius: 8,
  padding: 14,
};

const secondaryButtonStyle = {
  alignItems: 'center' as const,
  borderColor: '#cbd5e1',
  borderRadius: 8,
  borderWidth: 1,
  padding: 12,
};

const buttonTextStyle = {
  color: 'white',
  fontWeight: '700' as const,
};
