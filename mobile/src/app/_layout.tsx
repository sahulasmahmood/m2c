import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';
import '../../global.css';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';

// Silence Reanimated's "Reading/Writing to `value` during component render"
// strict-mode warnings — these come from third-party libs (keyboard-controller,
// gesture handler internals) that read shared values during render on purpose.
// Keep regular errors/warnings — just drop the render-phase strict checks.
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <CartProvider>
        <WishlistProvider>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(any)" options={{ headerShown: false }} />
          </Stack>
        </WishlistProvider>
      </CartProvider>
      <StatusBar style="light" backgroundColor="#000000" translucent={false} />
    </ThemeProvider>
  );
}
