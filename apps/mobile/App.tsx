import "./global.css";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
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
import { PendingRegistrationSubmit } from "./src/components/PendingRegistrationSubmit";
import { SignInScreen } from "./src/screens/SignInScreen";
import { DriverRegisterScreen } from "./src/screens/DriverRegisterScreen";
import { HomeScreen } from "./src/screens/HomeScreen";

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

export default function App() {
  return (
    <ConvexAuthProvider client={convex} storage={secureStorage}>
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-hercom">
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
              <HomeScreen />
            </PendingRegistrationSubmit>
          </Authenticated>
          <StatusBar style="light" />
        </SafeAreaView>
      </SafeAreaProvider>
    </ConvexAuthProvider>
  );
}
