import { Stack } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function AuthLayout() {
  const colors = useThemeColor();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
