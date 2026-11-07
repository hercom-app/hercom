import { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";
import type { Id } from "@proyecto/backend/dataModel";
import { AddressAutocomplete } from "../AddressAutocomplete";
import { HERCOM_COLORS, POPPINS } from "../../constants/theme";
import {
  SAFETY_PRIORITY_PHOTO,
  SERVICE_DISCOVERY_IMAGES,
} from "../../constants/homeAssets";
import type { AddressRegionFilter } from "../../lib/googlePlaces";
import type { RecentDestination } from "../../lib/recentDestinations";
import {
  ChevronRightGlyph,
  ClockGlyph,
  HomeGlyph,
  SearchGlyph,
} from "./RouteIcons";

const SERVICE_DISCOVERY = [
  {
    key: "corporativo",
    title: "Chofer Corporativo",
    url: "https://hercom-landing.vercel.app/servicios/chofer-corporativo",
    image: SERVICE_DISCOVERY_IMAGES.corporativo,
  },
  {
    key: "premium",
    title: "Chofer Premium",
    url: "https://hercom-landing.vercel.app/servicios/chofer-premium",
    image: SERVICE_DISCOVERY_IMAGES.premium,
  },
  {
    key: "seguro",
    title: "Chofer Seguro",
    url: "https://hercom-landing.vercel.app/servicios/chofer-seguro",
    image: SERVICE_DISCOVERY_IMAGES.seguro,
  },
  {
    key: "flota",
    title: "Chofer de Flota",
    url: "https://hercom-landing.vercel.app/servicios/chofer-de-flota",
    image: SERVICE_DISCOVERY_IMAGES.flota,
  },
] as const;

const SERVICE_TILE_HEIGHT = 188;
const HORIZONTAL_PADDING = 16;
const GRID_GAP = 10;

const SAFETY_TIPS = [
  { key: "vida", label: "No expongas tu vida o la de otros" },
  { key: "carcel", label: "Evita ir a la cárcel" },
  { key: "multas", label: "Evita multas" },
  { key: "accidentes", label: "Evita accidentes" },
] as const;

const COMMERCIAL_BASE =
  process.env.EXPO_PUBLIC_LIVE_SHARE_BASE_URL?.replace(/\/$/, "") ??
  "https://hercom-landing.vercel.app";

function SafetyAwarenessBlock() {
  const tipRows = [SAFETY_TIPS.slice(0, 2), SAFETY_TIPS.slice(2, 4)];
  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          height: 248,
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: "#0E0F11",
        }}
      >
        <Image
          source={SAFETY_PRIORITY_PHOTO}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          accessibilityLabel="Escena de un accidente de tránsito"
          style={{ width: "100%", height: "100%" }}
        />
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 16,
            paddingTop: 18,
            paddingBottom: 16,
            backgroundColor: "rgba(8, 8, 10, 0.72)",
          }}
        >
          <Text
            style={{
              fontFamily: POPPINS.bold,
              fontSize: 17,
              lineHeight: 22,
              letterSpacing: 0.3,
              color: "#FFFFFF",
            }}
          >
            TU SEGURIDAD ES NUESTRA PRIORIDAD
          </Text>
        </View>
      </View>

      <View style={{ gap: 8 }}>
        {tipRows.map((row) => (
          <View key={row.map((tip) => tip.key).join("-")} style={{ flexDirection: "row", gap: 8 }}>
            {row.map((tip) => (
              <View
                key={tip.key}
                style={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: 108,
                  borderRadius: 16,
                  backgroundColor: "#F3F4F6",
                  paddingHorizontal: 12,
                  paddingVertical: 14,
                  justifyContent: "flex-start",
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: HERCOM_COLORS.primary,
                    marginBottom: 10,
                  }}
                />
                <Text
                  style={{
                    fontFamily: POPPINS.semibold,
                    fontSize: 14,
                    lineHeight: 18,
                    color: HERCOM_COLORS.text,
                  }}
                >
                  {tip.label}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => {
          void Linking.openURL(`${COMMERCIAL_BASE}/cuidando-vidas`);
        }}
        accessibilityRole="link"
        accessibilityLabel="Infórmame más sobre cuidar vidas"
        style={({ pressed }) => ({
          height: 48,
          borderRadius: 14,
          backgroundColor: HERCOM_COLORS.primary,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.88 : 1,
        })}
      >
        <Text
          style={{
            fontFamily: POPPINS.semibold,
            fontSize: 15,
            color: "#FFFFFF",
          }}
        >
          Infórmame más
        </Text>
      </Pressable>
    </View>
  );
}

function ServiceDiscoveryTile({
  title,
  image,
  onPress,
}: {
  title: string;
  image: ImageSourcePropType | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={title}
      style={{ flex: 1, minWidth: 0, height: SERVICE_TILE_HEIGHT }}
    >
      <View
        collapsable={false}
        style={{
          flex: 1,
          borderRadius: 16,
          backgroundColor: "#F3F4F6",
          overflow: "hidden",
          paddingTop: 12,
          paddingHorizontal: 12,
          paddingBottom: 6,
          justifyContent: "space-between",
        }}
      >
        <Text
          numberOfLines={2}
          style={{
            fontFamily: POPPINS.semibold,
            fontSize: 14,
            lineHeight: 18,
            color: HERCOM_COLORS.text,
          }}
        >
          {title}
        </Text>
        {image !== null ? (
          <Image
            source={image}
            resizeMode="contain"
            fadeDuration={0}
            accessibilityIgnoresInvertColors
            style={{ width: "100%", height: 124, alignSelf: "flex-end" }}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

function ServiceDiscoveryGrid() {
  const rows = [SERVICE_DISCOVERY.slice(0, 2), SERVICE_DISCOVERY.slice(2, 4)];
  return (
    <View style={{ width: "100%", gap: GRID_GAP }}>
      {rows.map((row) => (
        <View
          key={row.map((s) => s.key).join("-")}
          style={{ flexDirection: "row", width: "100%", gap: GRID_GAP }}
        >
          {row.map((service) => (
            <ServiceDiscoveryTile
              key={service.key}
              title={service.title}
              image={service.image}
              onPress={() => {
                void Linking.openURL(service.url);
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export type HomeSavedPlace = RecentDestination & {
  id: Id<"savedPlaces">;
  kind: "home" | "favorite";
  label: string;
};

type PlaceDraft = {
  address: string;
  lat: number;
  lng: number;
};

type HomeRequestSheetProps = {
  recents: RecentDestination[];
  home: HomeSavedPlace | null;
  favorites: HomeSavedPlace[];
  placesReady: boolean;
  onSearchPress: () => void;
  onSelectRecent: (place: RecentDestination) => void;
  onSetHome: (place: PlaceDraft) => Promise<void>;
  onLocateHome: () => void;
  onSaveFavorite: (place: PlaceDraft) => Promise<void>;
  onRemovePlace: (placeId: Id<"savedPlaces">) => Promise<void>;
  addressRegion: AddressRegionFilter;
  gpsCenter?: { lat: number; lng: number };
  error: string | null;
  bottomInset: number;
};

function saveErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }
  return "No se pudo guardar el lugar.";
}

const PLACE_CHIP_HEIGHT = 60;

/** El borde va en un `View`: en Android un `Pressable` no pinta `borderWidth`. */
const PLACE_CHIP_BOX = {
  height: PLACE_CHIP_HEIGHT,
  flexDirection: "row" as const,
  alignItems: "center" as const,
  gap: 10,
  paddingHorizontal: 18,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "#D0D6DE",
  backgroundColor: "#FFFFFF",
};

const PLACE_CHIP_TEXT = {
  fontFamily: POPPINS.semibold,
  fontSize: 15,
  color: HERCOM_COLORS.text,
} as const;

function RecientesSectionHeader() {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 6,
        marginBottom: 2,
      }}
    >
      <Text
        style={{
          fontFamily: POPPINS.medium,
          fontSize: 13,
          color: HERCOM_COLORS.textMuted,
        }}
      >
        Recientes
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: HERCOM_COLORS.border }} />
    </View>
  );
}

function RecentRowIcon() {
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ClockGlyph size={20} color={HERCOM_COLORS.text} />
    </View>
  );
}

function HomePlaceChip({
  onPress,
  onLongPress,
}: {
  onPress: () => void;
  onLongPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel="Casa"
      accessibilityHint="Mantén presionado para editar"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View style={PLACE_CHIP_BOX}>
        <HomeGlyph size={22} color={HERCOM_COLORS.primary} />
        <Text numberOfLines={1} style={PLACE_CHIP_TEXT}>
          Casa
        </Text>
      </View>
    </Pressable>
  );
}

/** Sin acción hasta que exista la vista de direcciones guardadas. */
function MorePlacesChip() {
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel="Más direcciones, próximamente"
      style={PLACE_CHIP_BOX}
    >
      <Text numberOfLines={1} style={PLACE_CHIP_TEXT}>
        Más
      </Text>
      <ChevronRightGlyph size={18} color={HERCOM_COLORS.textMuted} />
    </View>
  );
}

function HomePlaceEditor({
  visible,
  region,
  gpsCenter,
  onClose,
  onSave,
  onLocateOnMap,
}: {
  visible: boolean;
  region: AddressRegionFilter;
  gpsCenter?: { lat: number; lng: number };
  onClose: () => void;
  onSave: (place: PlaceDraft) => Promise<void>;
  onLocateOnMap: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setDraft("");
      setSaving(false);
      setLocalError(null);
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      >
        <View
          style={{
            flex: 1,
            paddingHorizontal: 16,
            paddingTop: 18,
            paddingBottom: 24,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontFamily: POPPINS.bold,
                fontSize: 20,
                color: HERCOM_COLORS.text,
              }}
            >
              Casa
            </Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={8}>
              <Text
                style={{
                  fontFamily: POPPINS.semibold,
                  fontSize: 15,
                  color: HERCOM_COLORS.primary,
                }}
              >
                Cerrar
              </Text>
            </Pressable>
          </View>
          <AddressAutocomplete
            key={visible ? "home-editor-open" : "home-editor-closed"}
            value={draft}
            onChangeText={(value) => {
              setDraft(value);
              setLocalError(null);
            }}
            onPlaceSelected={(place) => {
              setDraft(place.address);
              void (async () => {
                setSaving(true);
                setLocalError(null);
                try {
                  await onSave({
                    address: place.address,
                    lat: place.lat,
                    lng: place.lng,
                  });
                } catch (error) {
                  setLocalError(saveErrorMessage(error));
                } finally {
                  setSaving(false);
                }
              })();
            }}
            expandedList
            autoFocus
            placeholder="Busca tu dirección"
            region={region}
            {...(gpsCenter !== undefined ? { gpsCenter } : {})}
            disabled={saving}
          />
          <Pressable
            onPress={onLocateOnMap}
            accessibilityRole="button"
            accessibilityLabel="Ubicar la casa en el mapa"
            style={{
              marginTop: 16,
              borderRadius: 14,
              backgroundColor: "#F3F4F6",
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: POPPINS.semibold,
                fontSize: 15,
                color: HERCOM_COLORS.text,
              }}
            >
              Ubicar en el mapa
            </Text>
          </Pressable>
          {localError !== null && (
            <Text
              style={{
                marginTop: 10,
                fontFamily: POPPINS.medium,
                fontSize: 13,
                color: HERCOM_COLORS.danger,
              }}
            >
              {localError}
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function HomeRequestSheet({
  recents,
  home,
  favorites,
  placesReady,
  onSearchPress,
  onSelectRecent,
  onSetHome,
  onLocateHome,
  onRemovePlace,
  addressRegion,
  gpsCenter,
  error,
  bottomInset,
}: HomeRequestSheetProps) {
  const [homeEditorOpen, setHomeEditorOpen] = useState(false);
  const savedAddresses = new Set(
    [home?.address, ...favorites.map((place) => place.address)]
      .filter((address): address is string => address !== undefined)
      .map((address) => address.trim().toLowerCase()),
  );
  const visibleRecents = recents.filter(
    (place) => !savedAddresses.has(place.address.trim().toLowerCase()),
  );

  return (
    <>
    <ScrollView
      style={{ flex: 1 }}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
      contentContainerStyle={{
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingBottom: bottomInset + 48,
        flexGrow: 1,
      }}
    >
      <Pressable
        onPress={onSearchPress}
        accessibilityRole="button"
        accessibilityLabel="¿A dónde te llevará tu chofer para remplazo?"
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: "#F3F4F6",
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 16,
        }}
      >
        <SearchGlyph size={22} color={HERCOM_COLORS.text} />
        <Text
          style={{
            flex: 1,
            fontFamily: POPPINS.medium,
            fontSize: 16,
            lineHeight: 22,
            color: HERCOM_COLORS.textMuted,
          }}
        >
          ¿A dónde te llevará tu chofer para remplazo?
        </Text>
      </Pressable>

      {placesReady && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingVertical: 14,
          }}
        >
          <HomePlaceChip
            onPress={() => {
              if (home === null) {
                setHomeEditorOpen(true);
                return;
              }
              onSelectRecent(home);
            }}
            onLongPress={() => setHomeEditorOpen(true)}
          />
          <MorePlacesChip />
        </View>
      )}

      {visibleRecents.length > 0 && (
        <View style={{ marginTop: 4 }}>
          <RecientesSectionHeader />
          {visibleRecents.map((place) => (
            <Pressable
              key={place.address}
              onPress={() => onSelectRecent(place)}
              accessibilityRole="button"
              accessibilityLabel={place.title}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 12,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <RecentRowIcon />
              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: POPPINS.semibold,
                    fontSize: 16,
                    color: HERCOM_COLORS.text,
                  }}
                >
                  {place.title}
                </Text>
                {place.subtitle !== undefined && (
                  <Text
                    numberOfLines={1}
                    style={{
                      marginTop: 2,
                      fontFamily: POPPINS.regular,
                      fontSize: 13,
                      color: HERCOM_COLORS.textMuted,
                    }}
                  >
                    {place.subtitle}
                  </Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <View style={{ marginTop: 22, gap: 10 }}>
        <Text
          style={{
            fontFamily: POPPINS.bold,
            fontSize: 17,
            lineHeight: 22,
            color: HERCOM_COLORS.text,
          }}
        >
          Más formas de usar Hercom
        </Text>
        <Text
          style={{
            fontFamily: POPPINS.regular,
            fontSize: 13,
            lineHeight: 18,
            color: HERCOM_COLORS.textMuted,
          }}
        >
          Haz click para ver más y contactar un ejecutivo
        </Text>
        <ServiceDiscoveryGrid />
      </View>

      <View style={{ marginTop: 22 }}>
        <SafetyAwarenessBlock />
      </View>

      {error !== null && (
        <Text
          style={{
            marginTop: 14,
            textAlign: "center",
            fontFamily: POPPINS.medium,
            fontSize: 13,
            color: HERCOM_COLORS.danger,
          }}
        >
          {error}
        </Text>
      )}
    </ScrollView>
    <HomePlaceEditor
      visible={homeEditorOpen}
      region={addressRegion}
      {...(gpsCenter !== undefined ? { gpsCenter } : {})}
      onClose={() => setHomeEditorOpen(false)}
      onLocateOnMap={() => {
        setHomeEditorOpen(false);
        onLocateHome();
      }}
      onSave={async (place) => {
        await onSetHome(place);
        setHomeEditorOpen(false);
      }}
    />
    </>
  );
}
