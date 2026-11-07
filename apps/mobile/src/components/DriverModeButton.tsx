import { Alert } from "react-native";
import { useAppMode } from "../contexts/AppModeContext";
import { UiButton } from "./ui";

/** Cambio a modo conductor, fuera del menú principal. */
export function DriverModeButton() {
  const {
    mode,
    setMode,
    canUseDriverMode,
    driverApplicationStatus,
    openDriverRegistration,
  } = useAppMode();

  async function handleModeSwitch() {
    if (mode === "client") {
      if (canUseDriverMode) {
        await setMode("driver");
        return;
      }
      if (driverApplicationStatus === "pending") {
        Alert.alert(
          "Solicitud en revisión",
          "Tu registro de chofer está siendo validado por Hercom. Te avisaremos cuando esté habilitado.",
        );
        return;
      }
      if (driverApplicationStatus === "rejected") {
        Alert.alert(
          "Solicitud no aprobada",
          "Tu solicitud anterior no fue aprobada. Puedes enviar una nueva con datos actualizados.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Reintentar", onPress: () => openDriverRegistration() },
          ],
        );
        return;
      }
      openDriverRegistration();
      return;
    }
    await setMode("client");
  }

  return (
    <UiButton
      label={mode === "client" ? "Modo conductor" : "Modo cliente"}
      onPress={() => void handleModeSwitch()}
    />
  );
}
