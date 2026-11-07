import { useState } from "react";
import type { Id } from "@proyecto/backend/dataModel";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { AppModal } from "./AppModal";
import { AdvancePayoutModal } from "./AdvancePayoutModal";
import { DriverInfoCard } from "./uber/DriverInfoCard";
import { TripPriceFooter } from "./uber/ClientActiveTripSheet";
import {
  TacticalButton,
  TacticalEmpty,
  TacticalValue,
} from "./tactical";
import { HERCOM_COLORS, MONO, TACTICAL_COLORS } from "../constants/theme";

export type DriverOfferInfo = {
  _id: Id<"serviceOffers">;
  offeredPrice: number;
  driverName: string;
  driverRating: number;
  driverTrips: number;
  driverAboutMe?: string;
  driverPhotoUrl?: string | null;
  driverDni?: string;
  driverYape?: string;
  driverPlin?: string;
  driverBankAccount1?: string;
  driverBankAccount2?: string;
  driverBankAccount3?: string;
};

type DriverOfferModalProps = {
  visible: boolean;
  offer: DriverOfferInfo | null;
  accepting: boolean;
  error: string | null;
  onClose: () => void;
  onAccept: () => void;
};

export function DriverOfferModal({
  visible,
  offer,
  accepting,
  error,
  onClose,
  onAccept,
}: DriverOfferModalProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <>
    <AppModal
      visible={visible}
      title="Información del chofer"
      onClose={onClose}
      footer={
        offer !== null ? (
          <View className="mt-3">
            <TacticalButton
              label={accepting ? "Confirmando..." : "Elegir este chofer"}
              onPress={onAccept}
              disabled={accepting}
              loading={accepting}
            />
          </View>
        ) : null
      }
    >
      {offer === null ? (
        <TacticalEmpty title="Sin oferta seleccionada" />
      ) : (
        <View>
          {offer.driverPhotoUrl !== undefined &&
            offer.driverPhotoUrl !== null &&
            offer.driverPhotoUrl !== "" && (
              <TouchableOpacity
                onPress={() => setProfileOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={`Selfie de ${offer.driverName}`}
              >
                <Image
                  source={{ uri: offer.driverPhotoUrl }}
                  style={{
                    width: 96,
                    height: 128,
                    borderRadius: 12,
                    marginBottom: 12,
                    backgroundColor: HERCOM_COLORS.surfaceMuted,
                  }}
                />
              </TouchableOpacity>
            )}
          <DriverInfoCard
            driverName={offer.driverName}
            rating={offer.driverRating}
            tripsCount={offer.driverTrips}
            avatarUrl={offer.driverPhotoUrl}
            onPressAvatar={() => setProfileOpen(true)}
            verified
          />
          {offer.driverAboutMe !== undefined && offer.driverAboutMe.trim() !== "" && (
            <Text
              style={{
                marginTop: 8,
                fontFamily: MONO.medium,
                fontSize: 14,
                lineHeight: 20,
                color: TACTICAL_COLORS.text,
              }}
            >
              {offer.driverAboutMe}
            </Text>
          )}
          <TripPriceFooter
            label="Tarifa ofertada"
            price={`S/${offer.offeredPrice.toFixed(2)}`}
          />
          {error !== null && (
            <Text
              className="mt-3 text-xs"
              style={{ fontFamily: MONO.medium, color: TACTICAL_COLORS.danger }}
            >
              {error}
            </Text>
          )}
        </View>
      )}
    </AppModal>
    {offer !== null && (
      <AdvancePayoutModal
        visible={profileOpen}
        onClose={() => setProfileOpen(false)}
        payout={{
          fullName: offer.driverName,
          aboutMe: offer.driverAboutMe ?? "",
          photoUrl: offer.driverPhotoUrl,
          dni: offer.driverDni ?? "",
          yape: offer.driverYape ?? "",
          plin: offer.driverPlin ?? "",
          bankAccount1: offer.driverBankAccount1 ?? "",
          bankAccount2: offer.driverBankAccount2 ?? "",
          bankAccount3: offer.driverBankAccount3 ?? "",
        }}
      />
    )}
    </>
  );
}
