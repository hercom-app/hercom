import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { CloseGlyph, MapGlyph, PersonGlyph, SearchGlyph } from "./request/RouteIcons";
import {
  createPlacesSessionToken,
  fetchPlaceDetails,
  fetchPlaceSuggestions,
  formatRegionScopeLabel,
  isGooglePlacesConfigured,
  selectedPlaceMatchesRegion,
  type AddressRegionFilter,
  type PlaceSuggestion,
  type SelectedPlace,
} from "../lib/googlePlaces";
import { TacticalLabel, TacticalText } from "./tactical";
import {
  MONO,
  POPPINS,
  TACTICAL_BORDER,
  TACTICAL_BORDER_SOFT,
  TACTICAL_COLORS,
  TACTICAL_RADIUS,
} from "../constants/theme";

type AddressAutocompleteProps = {
  value: string;
  onChangeText: (value: string) => void;
  onPlaceSelected: (place: SelectedPlace) => void;
  /** Tras validar place details (dirección lista para usar). */
  onPlaceResolved?: (place: SelectedPlace) => void;
  onPlaceCleared?: () => void;
  placeholder: string;
  region: AddressRegionFilter;
  gpsCenter?: { lat: number; lng: number };
  disabled?: boolean;
  selectedPlaceId?: string | null;
  /** Lista más alta (modo búsqueda expandida). */
  expandedList?: boolean;
  autoFocus?: boolean;
  /**
   * Si true, el blur del teclado NO cierra sugerencias.
   * Útil cuando el padre controla el sheet (evitar cierre por salto de layout).
   */
  keepActiveOnBlur?: boolean;
  /**
   * Campo del modal «Introduce tu ruta»: icono, aspa y mapa.
   * `active` cierra las sugerencias cuando el foco pasa al otro campo.
   */
  routeChrome?: {
    caption: "De" | "A";
    onOpenMap: () => void;
    onActivate?: () => void;
    active?: boolean;
  };
};

const DEBOUNCE_MS = 320;
const LIST_MAX_HEIGHT = 280;
const LIST_MAX_HEIGHT_EXPANDED = 420;

export function AddressAutocomplete({
  value,
  onChangeText,
  onPlaceSelected,
  onPlaceResolved,
  onPlaceCleared,
  placeholder,
  region,
  gpsCenter,
  disabled = false,
  selectedPlaceId = null,
  expandedList = false,
  autoFocus = false,
  keepActiveOnBlur = false,
  routeChrome,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchActive, setSearchActive] = useState(autoFocus);
  /** Tras elegir una sugerencia, no volver a buscar hasta que el usuario edite. */
  const suppressSearchRef = useRef(false);
  const sessionTokenRef = useRef(createPlacesSessionToken());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interactingWithListRef = useRef(false);
  const requestIdRef = useRef(0);
  const inputRef = useRef<TextInput>(null);
  const placesEnabled = isGooglePlacesConfigured();
  const canSearch = placesEnabled;

  const showSuggestions =
    searchActive &&
    !suppressSearchRef.current &&
    suggestions.length > 0 &&
    !disabled;

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
      if (blurTimeoutRef.current !== null) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!autoFocus || disabled) {
      return;
    }
    setSearchActive(true);
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 80);
    return () => clearTimeout(timer);
  }, [autoFocus, disabled]);

  useEffect(() => {
    if (routeChrome?.active === false) {
      setSearchActive(false);
      setSuggestions([]);
      setSearchError(null);
    }
  }, [routeChrome?.active]);

  useEffect(() => {
    if (selectedPlaceId !== null) {
      suppressSearchRef.current = true;
      setSearchActive(false);
      setSuggestions([]);
      setLoading(false);
      setSearchError(null);
    }
  }, [selectedPlaceId]);

  useEffect(() => {
    if (
      !searchActive ||
      !canSearch ||
      suppressSearchRef.current ||
      disabled ||
      selectedPlaceId !== null
    ) {
      if (!searchActive || selectedPlaceId !== null) {
        setSuggestions([]);
        if (selectedPlaceId !== null) {
          setLoading(false);
        }
      }
      return;
    }

    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }

    if (value.trim().length < 3) {
      setSuggestions([]);
      setLoading(false);
      setSearchError(null);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setSearchError(null);

    debounceRef.current = setTimeout(() => {
      void (async () => {
        try {
          const nextSuggestions = await fetchPlaceSuggestions(value, {
            region,
            sessionToken: sessionTokenRef.current,
            gpsCenter,
          });
          if (requestIdRef.current !== requestId) {
            return;
          }
          setSuggestions(nextSuggestions);
          if (nextSuggestions.length === 0) {
            setSearchError(
              region.department === ""
                ? "No hay sugerencias cerca. Prueba con más detalle (ej. «Mall del Sur»)."
                : `No hay sugerencias en ${formatRegionScopeLabel(region)}. Prueba con más detalle.`,
            );
          }
        } catch (error) {
          if (requestIdRef.current !== requestId) {
            return;
          }
          setSuggestions([]);
          setSearchError(
            error instanceof Error
              ? error.message
              : "No se pudieron cargar sugerencias.",
          );
        } finally {
          if (requestIdRef.current === requestId) {
            setLoading(false);
          }
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [canSearch, disabled, gpsCenter, region, searchActive, value]);

  function clearBlurTimeout() {
    if (blurTimeoutRef.current !== null) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  }

  function endSearch() {
    setSearchActive(false);
    setSuggestions([]);
    setSearchError(null);
    interactingWithListRef.current = false;
  }

  async function handleSelectSuggestion(suggestion: PlaceSuggestion) {
    clearBlurTimeout();
    interactingWithListRef.current = false;
    suppressSearchRef.current = true;
    endSearch();
    setLoading(true);
    requestIdRef.current += 1;
    try {
      const place = await fetchPlaceDetails(
        suggestion.placeId,
        sessionTokenRef.current,
      );
      if (!selectedPlaceMatchesRegion(place, region)) {
        throw new Error(
          region.department === ""
            ? "La dirección seleccionada no está en Perú."
            : `La dirección está fuera de ${formatRegionScopeLabel(region)}.`,
        );
      }
      onChangeText(place.address);
      onPlaceSelected(place);
      sessionTokenRef.current = createPlacesSessionToken();
      suppressSearchRef.current = true;
      endSearch();
      Keyboard.dismiss();
      inputRef.current?.blur();
      onPlaceResolved?.(place);
    } catch (error) {
      suppressSearchRef.current = false;
      setSearchActive(true);
      setSearchError(
        error instanceof Error
          ? error.message
          : "No se pudo validar la dirección seleccionada.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleChangeText(nextValue: string) {
    suppressSearchRef.current = false;
    setSearchActive(true);
    onChangeText(nextValue);
    if (selectedPlaceId !== null && onPlaceCleared !== undefined) {
      onPlaceCleared();
    }
  }

  function clearField() {
    suppressSearchRef.current = true;
    setSuggestions([]);
    setSearchError(null);
    setSearchActive(true);
    onChangeText("");
    onPlaceCleared?.();
    inputRef.current?.focus();
  }

  const inputHandlers = {
    ref: inputRef,
    value,
    onChangeText: handleChangeText,
    placeholder,
    placeholderTextColor: "rgba(91, 132, 177, 0.7)" as const,
    editable: !disabled,
    autoFocus,
    onFocus: () => {
      clearBlurTimeout();
      routeChrome?.onActivate?.();
      if (selectedPlaceId !== null) {
        suppressSearchRef.current = true;
        setSearchActive(false);
        return;
      }
      suppressSearchRef.current = false;
      setSearchActive(true);
    },
    onBlur: () => {
      if (keepActiveOnBlur) {
        return;
      }
      clearBlurTimeout();
      blurTimeoutRef.current = setTimeout(() => {
        if (interactingWithListRef.current) {
          return;
        }
        endSearch();
      }, 220);
    },
  };

  return (
    <View>
      {routeChrome !== undefined ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            backgroundColor:
              routeChrome.caption === "De" ? "#F4F5F7" : "#FFFFFF",
            borderRadius: 16,
            borderWidth: routeChrome.caption === "A" ? 1.5 : 0,
            borderColor: "#1C1E22",
            paddingHorizontal: 12,
            paddingVertical: routeChrome.caption === "De" ? 10 : 8,
            minHeight: 58,
          }}
        >
          {routeChrome.caption === "De" ? (
            <PersonGlyph size={22} color="#111111" />
          ) : (
            <SearchGlyph size={22} color="#111111" />
          )}
          <View style={{ flex: 1 }}>
            {routeChrome.caption === "De" && (
              <Text
                style={{
                  fontFamily: POPPINS.medium,
                  fontSize: 12,
                  color: TACTICAL_COLORS.steel,
                  marginBottom: 1,
                }}
              >
                De
              </Text>
            )}
            <TextInput
              {...inputHandlers}
              placeholder={routeChrome.caption === "A" ? "A" : placeholder}
              placeholderTextColor="#98A2B3"
              style={{
                padding: 0,
                margin: 0,
                fontFamily: POPPINS.medium,
                fontSize: 16,
                color: disabled
                  ? TACTICAL_COLORS.steel
                  : TACTICAL_COLORS.textStrong,
              }}
            />
          </View>
          {value.trim() !== "" && (
            <Pressable
              onPress={clearField}
              accessibilityLabel="Borrar"
              hitSlop={8}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(15, 23, 42, 0.06)",
              }}
            >
              <CloseGlyph size={14} color="#64748B" />
            </Pressable>
          )}
          <Pressable
            onPress={routeChrome.onOpenMap}
            accessibilityLabel="Elegir en el mapa"
            hitSlop={6}
            style={{
              width: 36,
              height: 36,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MapGlyph size={22} />
          </Pressable>
        </View>
      ) : (
      <TextInput
        {...inputHandlers}
        style={{
          backgroundColor: TACTICAL_COLORS.surfaceSunken,
          borderRadius: TACTICAL_RADIUS.sharp,
          borderWidth: 1,
          borderColor:
            selectedPlaceId !== null ? TACTICAL_COLORS.accent : TACTICAL_BORDER,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontFamily: POPPINS.regular,
          fontSize: 15,
          color: disabled
            ? TACTICAL_COLORS.steel
            : TACTICAL_COLORS.textStrong,
        }}
      />
      )}

      {!placesEnabled && (
        <Text
          className="mt-1.5 text-[11px]"
          style={{ fontFamily: MONO.medium, color: TACTICAL_COLORS.warning }}
        >
          Sin API key de Google: puedes escribir la dirección manualmente.
        </Text>
      )}

      {loading && searchActive && selectedPlaceId === null && (
        <View className="mt-2 flex-row items-center gap-2">
          <ActivityIndicator color={TACTICAL_COLORS.accent} size="small" />
          <TacticalLabel>Buscando direcciones...</TacticalLabel>
        </View>
      )}

      {loading && !searchActive && selectedPlaceId === null && (
        <View className="mt-2 flex-row items-center gap-2">
          <ActivityIndicator color={TACTICAL_COLORS.accent} size="small" />
          <TacticalLabel>Confirmando dirección…</TacticalLabel>
        </View>
      )}

      {searchError !== null && !loading && searchActive && (
        <Text
          className="mt-1.5 text-[11px]"
          style={{ fontFamily: MONO.medium, color: TACTICAL_COLORS.warning }}
        >
          {searchError}
        </Text>
      )}

      {showSuggestions && (
        <View
          className="mt-2 overflow-hidden"
          style={{
            backgroundColor: TACTICAL_COLORS.surface,
            borderRadius: TACTICAL_RADIUS.panel,
            borderWidth: 1,
            borderColor: TACTICAL_BORDER,
          }}
          onTouchStart={() => {
            interactingWithListRef.current = true;
            clearBlurTimeout();
          }}
        >
          <ScrollView
            style={{
              maxHeight: expandedList
                ? LIST_MAX_HEIGHT_EXPANDED
                : LIST_MAX_HEIGHT,
            }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator
            bounces
          >
            {suggestions.map((suggestion) => (
              <Pressable
                key={suggestion.placeId}
                onPressIn={() => {
                  interactingWithListRef.current = true;
                  clearBlurTimeout();
                }}
                onPress={() => void handleSelectSuggestion(suggestion)}
                style={({ pressed }) => ({
                  borderBottomWidth: 1,
                  borderBottomColor: TACTICAL_BORDER_SOFT,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  backgroundColor: pressed
                    ? "rgba(161, 196, 253, 0.12)"
                    : "transparent",
                })}
              >
                <Text
                  style={{
                    fontFamily: POPPINS.medium,
                    fontSize: 14,
                    color: TACTICAL_COLORS.text,
                  }}
                >
                  {suggestion.mainText}
                </Text>
                {suggestion.secondaryText !== undefined && (
                  <TacticalText size={11} className="mt-0.5">
                    {suggestion.secondaryText}
                  </TacticalText>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
