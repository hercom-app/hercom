import "./global.css";
import { useEffect } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  Authenticated,
  AuthLoading,
  ConvexReactClient,
  Unauthenticated,
} from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import * as SecureStore from "expo-secure-store";
import {
  useFonts,
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
  WorkSans_700Bold,
} from "@expo-google-fonts/work-sans";
import { Arvo_400Regular, Arvo_700Bold } from "@expo-google-fonts/arvo";
import { AppErrorBoundary } from "./src/components/AppErrorBoundary";
import { AuthSessionGuard } from "./src/components/AuthSessionGuard";
import { LiveShareLinkListener } from "./src/components/LiveShareLinkListener";
import { NotificationBridge } from "./src/components/NotificationBridge";
import { PendingRegistrationSubmit } from "./src/components/PendingRegistrationSubmit";
import { AppModeProvider } from "./src/contexts/AppModeContext";
import { ThemeProvider, useAppTheme } from "./src/contexts/ThemeContext";
import { SignInScreen } from "./src/screens/SignInScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { POPPINS, TACTICAL_COLORS, TYPE } from "./src/constants/theme";

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
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
    WorkSans_700Bold,
    Arvo_400Regular,
    Arvo_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      applyTypeDefaults();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: TACTICAL_COLORS.base }}
      >
        <ActivityIndicator color={TACTICAL_COLORS.accent} />
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
  const { scheme, colors } = useAppTheme();

  return (
    <ConvexAuthProvider client={convex} storage={secureStorage}>
      <SafeAreaProvider>
        <SafeAreaView
          className="flex-1"
          style={{ backgroundColor: colors.base }}
          edges={["left", "right"]}
        >
          <LiveShareLinkListener />
          <AuthLoading>
            <View
              className="flex-1 items-center justify-center"
              style={{ backgroundColor: colors.base }}
            >
              <ActivityIndicator color={colors.accent} />
            </View>
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
          <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        </SafeAreaView>
      </SafeAreaProvider>
    </ConvexAuthProvider>
  );
}
