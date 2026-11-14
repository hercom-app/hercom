import { Component, type ErrorInfo, type ReactNode } from "react";
import { View } from "react-native";
import { reportAppError } from "../lib/appErrorReporter";
import {
  TacticalButton,
  TacticalPanel,
  TacticalScreen,
  TacticalStatus,
  TacticalText,
  TacticalTitle,
} from "./tactical";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  override state: AppErrorBoundaryState = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || "Se produjo un error inesperado.",
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("AppErrorBoundary", error, errorInfo.componentStack);
    void reportAppError({
      kind: "boundary",
      message: error.message || "Error de pantalla",
      stack: [error.stack, errorInfo.componentStack]
        .filter((part) => part !== undefined && part !== null && part !== "")
        .join("\n"),
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, message: "" });
  };

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <TacticalScreen className="items-center justify-center px-6">
        <TacticalPanel corners className="w-full max-w-sm">
          <View className="flex-row">
            <TacticalStatus label="Falla de sistema" tone="danger" />
          </View>
          <TacticalTitle size={18} className="mt-3">
            Ocurrió un error
          </TacticalTitle>
          <TacticalText size={12} className="mt-2">
            {this.state.message}
          </TacticalText>
          <View className="mt-5">
            <TacticalButton label="Reintentar" onPress={this.handleRetry} />
          </View>
        </TacticalPanel>
      </TacticalScreen>
    );
  }
}
