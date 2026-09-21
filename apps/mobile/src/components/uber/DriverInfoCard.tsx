import { Image, Text, View } from "react-native";
import { HERCOM_COLORS, POPPINS, TYPE, UBER_RADIUS } from "../../constants/theme";

type DriverInfoCardProps = {
  driverName: string;
  tripsCount?: number;
  rating?: number;
  vehicleLabel?: string;
  plate?: string;
  avatarUrl?: string;
  verified?: boolean;
};

/** Tarjeta chofer + vehículo — placa grande, badge verificado. */
export function DriverInfoCard({
  driverName,
  tripsCount = 0,
  rating,
  vehicleLabel,
  plate,
  avatarUrl,
  verified = true,
}: DriverInfoCardProps) {
  return (
    <View className="mx-4 mb-3 px-4 py-4" style={{ borderTopWidth: 1, borderTopColor: HERCOM_COLORS.border }}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          {plate !== undefined && plate !== "" && (
            <Text
              style={{
                fontFamily: POPPINS.bold,
                fontSize: TYPE.headline,
                color: HERCOM_COLORS.text,
                letterSpacing: 1,
              }}
            >
              {plate}
            </Text>
          )}
          {vehicleLabel !== undefined && vehicleLabel !== "" && (
            <Text
              style={{
                fontFamily: POPPINS.regular,
                fontSize: TYPE.body,
                color: HERCOM_COLORS.textMuted,
                marginTop: 4,
              }}
            >
              {vehicleLabel}
            </Text>
          )}
          <View className="mt-3 flex-row flex-wrap items-center gap-2">
            <Text
              style={{
                fontFamily: POPPINS.semibold,
                fontSize: TYPE.bodyLg,
                color: HERCOM_COLORS.text,
              }}
            >
              {driverName}
            </Text>
            {tripsCount > 0 && (
              <Text
                style={{
                  fontFamily: POPPINS.regular,
                  fontSize: TYPE.caption,
                  color: HERCOM_COLORS.textMuted,
                }}
              >
                +{tripsCount} viajes
              </Text>
            )}
            {rating !== undefined && (
              <Text
                style={{
                  fontFamily: POPPINS.medium,
                  fontSize: TYPE.caption,
                  color: HERCOM_COLORS.textMuted,
                }}
              >
                {rating.toFixed(1)} ★
              </Text>
            )}
          </View>
          {verified && (
            <View
              className="mt-2 self-start px-2.5 py-1"
              style={{
                backgroundColor: HERCOM_COLORS.primarySoft,
                borderRadius: UBER_RADIUS.pill,
              }}
            >
              <Text
                style={{
                  fontFamily: POPPINS.semibold,
                  fontSize: TYPE.caption,
                  color: HERCOM_COLORS.primary,
                }}
              >
                ✓ Chofer verificado
              </Text>
            </View>
          )}
        </View>
        {avatarUrl !== undefined && avatarUrl !== "" ? (
          <Image
            source={{ uri: avatarUrl }}
            className="h-14 w-14 rounded-full"
            style={{ backgroundColor: HERCOM_COLORS.surfaceMuted }}
          />
        ) : (
          <View
            className="h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: HERCOM_COLORS.surfaceMuted }}
          >
            <Text style={{ fontFamily: POPPINS.bold, fontSize: 20, color: HERCOM_COLORS.primary }}>
              {driverName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
