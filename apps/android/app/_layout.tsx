import { Stack } from 'expo-router';
import { AuthProvider } from '../lib/auth-context';

export default function Layout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'SmartMove' }} />
        <Stack.Screen name="add-box" options={{ title: 'Add Box' }} />
        <Stack.Screen name="box/[id]" options={{ title: 'Box Details' }} />
      </Stack>
    </AuthProvider>
  );
}
