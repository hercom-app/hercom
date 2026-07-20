import "./global.css";
import { useEffect, useState } from "react";
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
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { AppErrorBoundary } from "./src/components/AppErrorBoundary";
import { PendingRegistrationSubmit } from "./src/components/PendingRegistrationSubmit";
import { AppModeProvider } from "./src/contexts/AppModeContext";
import { SignInScreen } from "./src/screens/SignInScreen";
import { DriverRegisterScreen } from "./src/screens/DriverRegisterScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { POPPINS } from "./src/constants/theme";

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

type GuestScreen = "signIn" | "driverRegister";

function UnauthenticatedFlow() {
  const [screen, setScreen] = useState<GuestScreen>("signIn");

  if (screen === "driverRegister") {
    return (
      <DriverRegisterScreen onBack={() => setScreen("signIn")} />
    );
  }

  return (
    <SignInScreen onDriverRegister={() => setScreen("driverRegister")} />
  );
}

function applyPoppinsDefaults() {
  const textDefaults = Text as unknown as {
    defaultProps?: { style?: unknown };
  };
  const inputDefaults = TextInput as unknown as {
    defaultProps?: { style?: unknown };
  };
  textDefaults.defaultProps = {
    ...(textDefaults.defaultProps ?? {}),
    style: [{ fontFamily: POPPINS.regular }, textDefaults.defaultProps?.style],
  };
  inputDefaults.defaultProps = {
    ...(inputDefaults.defaultProps ?? {}),
    style: [{ fontFamily: POPPINS.regular }, inputDefaults.defaultProps?.style],
  };
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      applyPoppinsDefaults();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-hercom">
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  return (
    <AppErrorBoundary>
      <ConvexAuthProvider client={convex} storage={secureStorage}>
        <SafeAreaProvider>
          <SafeAreaView className="flex-1 bg-slate-100" edges={["left", "right"]}>
            <AuthLoading>
              <View className="flex-1 items-center justify-center bg-hercom">
                <ActivityIndicator color="#FFFFFF" />
              </View>
            </AuthLoading>
            <Unauthenticated>
              <UnauthenticatedFlow />
            </Unauthenticated>
            <Authenticated>
              <PendingRegistrationSubmit>
                <AppModeProvider>
                  <HomeScreen />
                </AppModeProvider>
              </PendingRegistrationSubmit>
            </Authenticated>
            <StatusBar style="dark" />
          </SafeAreaView>
        </SafeAreaProvider>
      </ConvexAuthProvider>
    </AppErrorBoundary>
  );
}
