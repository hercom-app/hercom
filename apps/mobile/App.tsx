import "./global.css";
import { useEffect } from "react";
import { Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  Authenticated,
  AuthLoading,
  ConvexReactClient,
  Unauthenticated,
  useConvexAuth,
} from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import * as SecureStore from "expo-secure-store";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { AppErrorBoundary } from "./src/components/AppErrorBoundary";
import { AuthSessionGuard } from "./src/components/AuthSessionGuard";
import { LiveShareLinkListener } from "./src/components/LiveShareLinkListener";
import { NotificationBridge } from "./src/components/NotificationBridge";
import { PendingRegistrationSubmit } from "./src/components/PendingRegistrationSubmit";
import { AppModeProvider } from "./src/contexts/AppModeContext";
import { ThemeProvider, useAppTheme } from "./src/contexts/ThemeContext";
import { SignInScreen } from "./src/screens/SignInScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { HERCOM_COLORS, POPPINS, TYPE } from "./src/constants/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("Falta EXPO_PUBLIC_CONVEX_URL en el archivo .env");
}

const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false,
});

const secureStorage = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

function applyTypeDefaults() {
  const textDefaults = Text as unknown as {
    defaultProps?: { style?: unknown };
  };
  const inputDefaults = TextInput as unknown as {
    defaultProps?: { style?: unknown };
  };
  textDefaults.defaultProps = {
    ...(textDefaults.defaultProps ?? {}),
    style: [
      { fontFamily: POPPINS.regular, fontSize: TYPE.body },
      textDefaults.defaultProps?.style,
    ],
  };
  inputDefaults.defaultProps = {
    ...(inputDefaults.defaultProps ?? {}),
    style: [
      { fontFamily: POPPINS.regular, fontSize: TYPE.bodyLg },
      inputDefaults.defaultProps?.style,
    ],
  };
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      applyTypeDefaults();
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View className="flex-1" style={{ backgroundColor: HERCOM_COLORS.primary }}>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </AppErrorBoundary>
  );
}

function ThemedApp() {
  return (
    <ConvexAuthProvider client={convex} storage={secureStorage}>
      <SafeAreaProvider>
        <AuthChrome />
      </SafeAreaProvider>
    </ConvexAuthProvider>
  );
}

function AuthChrome() {
  const { scheme, colors } = useAppTheme();
  const { isAuthenticated } = useConvexAuth();
  const onBrandSplash = !isAuthenticated;
  const chrome = onBrandSplash ? HERCOM_COLORS.primary : colors.base;

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: chrome }}
      edges={["left", "right"]}
    >
      <LiveShareLinkListener />
      <AuthLoading>
        <View
          className="flex-1"
          style={{ backgroundColor: HERCOM_COLORS.primary }}
        />
      </AuthLoading>
      <Unauthenticated>
        <SignInScreen />
      </Unauthenticated>
      <Authenticated>
        <AuthSessionGuard>
          <PendingRegistrationSubmit>
            <AppModeProvider>
              <NotificationBridge />
              <HomeScreen />
            </AppModeProvider>
          </PendingRegistrationSubmit>
        </AuthSessionGuard>
      </Authenticated>
      <StatusBar
        style={onBrandSplash || scheme === "dark" ? "light" : "dark"}
      />
    </SafeAreaView>
  );
}
