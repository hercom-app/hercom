import { Component, type ErrorInfo, type ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";

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
  }

  private handleRetry = () => {
    this.setState({ hasError: false, message: "" });
  };

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View className="flex-1 items-center justify-center bg-canvas px-6">
        <View className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-lg">
          <Text className="mb-2 text-center text-lg font-bold text-slate-900">
            Ocurrió un error
          </Text>
          <Text className="text-center text-sm text-slate-600">
            {this.state.message}
          </Text>
          <TouchableOpacity
            onPress={this.handleRetry}
            className="mt-5 h-14 items-center justify-center rounded-2xl bg-hercom"
          >
            <Text className="text-center text-base font-bold text-white">
              Reintentar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}
