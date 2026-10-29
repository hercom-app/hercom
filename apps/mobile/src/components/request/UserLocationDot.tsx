import { useEffect, useState } from "react";
import { View } from "react-native";
import { Marker } from "react-native-maps";

type UserLocationDotProps = {
  latitude: number;
  longitude: number;
};

/**
 * Punto de ubicación fijo. El punto azul de Google parpadea el halo de
 * precisión y no se puede apagar; este marcador lo reemplaza.
 */
export function UserLocationDot({ latitude, longitude }: UserLocationDotProps) {
  const [track, setTrack] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setTrack(false), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={track}
      zIndex={2}
    >
      <View
        collapsable={false}
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: "#1A73E8",
          borderWidth: 3,
          borderColor: "#FFFFFF",
        }}
      />
    </Marker>
  );
}
