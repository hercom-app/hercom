import { useEffect, useState } from "react";
import {
  Alert,
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
import { HomeGlyph, PinGlyph, SearchGlyph } from "./RouteIcons";

const SERVICE_DISCOVERY = [
  {
    key: "premium",
    title: "Chofer Premium",
    url: "https://hercom-landing.vercel.app/servicios/chofer-premium",
    image: SERVICE_DISCOVERY_IMAGES.premium,
  },
  {
    key: "corporativo",
    title: "Chofer Corporativo",
    url: "https://hercom-landing.vercel.app/servicios/chofer-corporativo",
    image: null,
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
            top: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 16,
            backgroundColor: "rgba(8, 8, 10, 0.62)",
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
                  borderRadius: 12,
                  backgroundColor: "#14171C",
                  borderWidth: 1,
                  borderColor: "#2C313A",
                  paddingHorizontal: 12,
                  paddingVertical: 14,
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: "#B91C1C",
                  }}
                />
                <Text
                  style={{
                    fontFamily: POPPINS.semibold,
                    fontSize: 14,
                    lineHeight: 18,
                    color: "#F4F4F5",
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
          backgroundColor: HERCOM_COLORS.text,
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

function PlaceIcon({ kind }: { kind: "home" | "recent" | "favorite" }) {
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: kind === "home" ? "#E8F2FF" : "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {kind === "home" ? (
        <HomeGlyph size={18} color={HERCOM_COLORS.primary} />
      ) : (
        <PinGlyph size={18} color={HERCOM_COLORS.text} />
      )}
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
  onSaveFavorite,
  onRemovePlace,
  addressRegion,
  gpsCenter,
  error,
  bottomInset,
}: HomeRequestSheetProps) {
  const [homeEditorOpen, setHomeEditorOpen] = useState(false);
  const [savingPlace, setSavingPlace] = useState(false);

  const savedAddresses = new Set(
    [home?.address, ...favorites.map((place) => place.address)]
      .filter((address): address is string => address !== undefined)
      .map((address) => address.trim().toLowerCase()),
  );
  const visibleRecents = recents.filter(
    (place) => !savedAddresses.has(place.address.trim().toLowerCase()),
  );

  async function runSave(action: () => Promise<void>) {
    if (savingPlace) {
      return;
    }
    setSavingPlace(true);
    try {
      await action();
    } catch (saveError) {
      Alert.alert("No se pudo actualizar", saveErrorMessage(saveError));
    } finally {
      setSavingPlace(false);
    }
  }

  function promptSaveRecent(place: RecentDestination) {
    Alert.alert(place.title, "¿Dónde lo guardamos?", [
      {
        text: "Como tu casa",
        onPress: () => {
          void runSave(() =>
            onSetHome({
              address: place.address,
              lat: place.lat,
              lng: place.lng,
            }),
          );
        },
      },
      {
        text: "Como favorito",
        onPress: () => {
          void runSave(() =>
            onSaveFavorite({
              address: place.address,
              lat: place.lat,
              lng: place.lng,
            }),
          );
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

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

      {(placesReady || visibleRecents.length > 0) && (
        <View style={{ marginTop: 8 }}>
          {placesReady && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingVertical: 12,
            }}
          >
            <Pressable
              onPress={() => {
                if (home === null) {
                  setHomeEditorOpen(true);
                  return;
                }
                onSelectRecent(home);
              }}
              accessibilityRole="button"
              accessibilityLabel={home === null ? "Casa" : "Ir a tu casa"}
              style={({ pressed }) => ({
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <PlaceIcon kind="home" />
              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: POPPINS.semibold,
                    fontSize: 16,
                    color: HERCOM_COLORS.text,
                  }}
                >
                  Casa
                </Text>
                {home !== null && (
                  <Text
                    numberOfLines={1}
                    style={{
                      marginTop: 2,
                      fontFamily: POPPINS.regular,
                      fontSize: 13,
                      color: HERCOM_COLORS.textMuted,
                    }}
                  >
                    {home.title}
                  </Text>
                )}
              </View>
            </Pressable>
            {home !== null && (
            <Pressable
              onPress={() => setHomeEditorOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Cambiar casa"
              hitSlop={8}
            >
              <Text
                style={{
                  fontFamily: POPPINS.semibold,
                  fontSize: 13,
                  color: HERCOM_COLORS.primary,
                }}
              >
                Cambiar
              </Text>
            </Pressable>
            )}
          </View>
          )}

          {favorites.map((place) => (
            <View
              key={place.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 12,
              }}
            >
              <Pressable
                onPress={() => onSelectRecent(place)}
                accessibilityRole="button"
                accessibilityLabel={place.title}
                style={({ pressed }) => ({
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <PlaceIcon kind="favorite" />
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
              <Pressable
                onPress={() => {
                  Alert.alert("Quitar favorito", place.title, [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Quitar",
                      style: "destructive",
                      onPress: () => {
                        void runSave(() => onRemovePlace(place.id));
                      },
                    },
                  ]);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Quitar ${place.title}`}
                hitSlop={8}
              >
                <Text
                  style={{
                    fontFamily: POPPINS.semibold,
                    fontSize: 13,
                    color: HERCOM_COLORS.textMuted,
                  }}
                >
                  Quitar
                </Text>
              </Pressable>
            </View>
          ))}

          {visibleRecents.map((place) => (
            <View
              key={place.address}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 12,
              }}
            >
              <Pressable
                onPress={() => onSelectRecent(place)}
                accessibilityRole="button"
                accessibilityLabel={place.title}
                style={({ pressed }) => ({
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <PlaceIcon kind="recent" />
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
              <Pressable
                onPress={() => promptSaveRecent(place)}
                accessibilityRole="button"
                accessibilityLabel={`Guardar ${place.title}`}
                hitSlop={8}
                disabled={savingPlace}
              >
                <Text
                  style={{
                    fontFamily: POPPINS.semibold,
                    fontSize: 13,
                    color: HERCOM_COLORS.primary,
                  }}
                >
                  Guardar
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={{ marginTop: 16 }}>
        <SafetyAwarenessBlock />
      </View>

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
        <ServiceDiscoveryGrid />
        <Text
          style={{
            fontFamily: POPPINS.regular,
            fontSize: 13,
            lineHeight: 18,
            color: HERCOM_COLORS.textMuted,
          }}
        >
          Da click para enterarte más y contactarte con un ejecutivo
        </Text>
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
      onClose={() => {
        if (!savingPlace) {
          setHomeEditorOpen(false);
        }
      }}
      onLocateOnMap={() => {
        if (savingPlace) {
          return;
        }
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
