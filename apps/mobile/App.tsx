import "./global.css";
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
import { SignInScreen } from "./src/screens/SignInScreen";
import { DriverDashboard } from "./src/screens/DriverDashboard";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("Falta EXPO_PUBLIC_CONVEX_URL en el archivo .env");
}

const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false,
});

// Almacenamiento seguro para los tokens de Convex Auth en el dispositivo.
const secureStorage = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

export default function App() {
  return (
    <ConvexAuthProvider client={convex} storage={secureStorage}>
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-slate-50">
          <AuthLoading>
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#2563eb" />
            </View>
          </AuthLoading>
          <Unauthenticated>
            <SignInScreen />
          </Unauthenticated>
          <Authenticated>
            <DriverDashboard />
          </Authenticated>
          <StatusBar style="dark" />
        </SafeAreaView>
      </SafeAreaProvider>
    </ConvexAuthProvider>
  );
}
