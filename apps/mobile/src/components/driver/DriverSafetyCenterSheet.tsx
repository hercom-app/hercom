import { useState } from "react";
import { Linking, ScrollView, View } from "react-native";
import type { Doc } from "@proyecto/backend/dataModel";
import { DriverSheet, DriverSheetRow } from "./DriverSheet";
import { NearbyHealthModal } from "../HelpFab";
import { TripSecurityPin } from "../uber/TripSecurityPin";
import { HELP_CONTACTS } from "../../constants/helpContacts";
import { canShareLiveTrip } from "../../lib/serviceStatus";
import { HERCOM_COLORS } from "../../constants/theme";

type DriverSafetyCenterSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Viaje en curso: habilita compartir ubicación y código de seguridad. */
  activeService?: Doc<"services">;
  fallbackCenter?: { lat: number; lng: number };
  onShareTrip: () => void;
  onOpenSupport: () => void;
};

/** Centro de seguridad del chofer (escudo en Servicio). */
export function DriverSafetyCenterSheet({
  visible,
  onClose,
  activeService,
  fallbackCenter,
  onShareTrip,
  onOpenSupport,
}: DriverSafetyCenterSheetProps) {
  const [showCode, setShowCode] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const securityCode = activeService?.securityCode;
  const canShare = activeService !== undefined && canShareLiveTrip(activeService.status);

  function close() {
    setShowCode(false);
    onClose();
  }

  return (
    <>
      <DriverSheet visible={visible} title="Centro de seguridad" onClose={close}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <DriverSheetRow
            icon="phone"
            iconColor={HERCOM_COLORS.danger}
            title={`Llamar al ${HELP_CONTACTS.policePhone}`}
            subtitle="Policía Nacional del Perú"
            onPress={() => void Linking.openURL(`tel:${HELP_CONTACTS.policePhone}`)}
          />
          <DriverSheetRow
            icon="phone"
            title={`Llamar al ${HELP_CONTACTS.ambulancePhone}`}
            subtitle="Emergencia médica (SAMU)"
            onPress={() => void Linking.openURL(`tel:${HELP_CONTACTS.ambulancePhone}`)}
          />
          <DriverSheetRow
            icon="phone"
            title={`Llamar al ${HELP_CONTACTS.firefightersPhone}`}
            subtitle="Bomberos"
            onPress={() =>
              void Linking.openURL(`tel:${HELP_CONTACTS.firefightersPhone}`)
            }
          />
          <DriverSheetRow
            icon="medical"
            title="Hospital o clínica cercana"
            subtitle="Te guiamos con Waze"
            onPress={() => setHealthOpen(true)}
          />
          <DriverSheetRow
            icon="share"
            title="Compartir viaje"
            subtitle={
              canShare
                ? "Enlace para familiares (viaje en curso)"
                : "Disponible cuando el viaje ya haya iniciado"
            }
            disabled={!canShare}
            onPress={() => {
              close();
              onShareTrip();
            }}
          />
          <DriverSheetRow
            icon="key"
            title="Código de seguridad"
            subtitle={
              securityCode !== undefined
                ? "Código único de este viaje"
                : "Disponible cuando tengas un viaje asignado"
            }
            disabled={securityCode === undefined}
            onPress={() => setShowCode((prev) => !prev)}
          />
          {showCode && securityCode !== undefined && (
            <TripSecurityPin pin={securityCode} inset={false} style={{ marginTop: 4 }} />
          )}
          <DriverSheetRow
            icon="chat"
            title="Soporte Hercom"
            subtitle="Escríbenos por el chat"
            onPress={() => {
              close();
              onOpenSupport();
            }}
          />
          <View style={{ height: 8 }} />
        </ScrollView>
      </DriverSheet>
      <NearbyHealthModal
        visible={healthOpen}
        onClose={() => setHealthOpen(false)}
        fallbackCenter={fallbackCenter}
      />
    </>
  );
}
