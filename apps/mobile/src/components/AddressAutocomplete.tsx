import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
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

type AddressAutocompleteProps = {
  value: string;
  onChangeText: (value: string) => void;
  onPlaceSelected: (place: SelectedPlace) => void;
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
};

const DEBOUNCE_MS = 320;
const LIST_MAX_HEIGHT = 280;
const LIST_MAX_HEIGHT_EXPANDED = 420;

export function AddressAutocomplete({
  value,
  onChangeText,
  onPlaceSelected,
  onPlaceCleared,
  placeholder,
  region,
  gpsCenter,
  disabled = false,
  selectedPlaceId = null,
  expandedList = false,
  autoFocus = false,
  keepActiveOnBlur = false,
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
    if (!searchActive || !canSearch || suppressSearchRef.current || disabled) {
      if (!searchActive) {
        setSuggestions([]);
        setLoading(false);
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

  return (
    <View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        editable={!disabled}
        autoFocus={autoFocus}
        onFocus={() => {
          clearBlurTimeout();
          suppressSearchRef.current = false;
          setSearchActive(true);
        }}
        onBlur={() => {
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
        }}
        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
      />

      {!placesEnabled && (
        <Text className="mt-1 text-[11px] text-warning">
          Sin API key de Google: puedes escribir la dirección manualmente.
        </Text>
      )}

      {loading && searchActive && (
        <View className="mt-2 flex-row items-center gap-2">
          <ActivityIndicator color="#64748B" size="small" />
          <Text className="text-xs text-slate-500">Buscando direcciones...</Text>
        </View>
      )}

      {searchError !== null && !loading && searchActive && (
        <Text className="mt-1 text-xs text-warning">{searchError}</Text>
      )}

      {showSuggestions && (
        <View
          className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white"
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
                className="border-b border-slate-100 px-4 py-3 active:bg-slate-50"
              >
                <Text className="text-sm font-semibold text-slate-900">
                  {suggestion.mainText}
                </Text>
                {suggestion.secondaryText !== undefined && (
                  <Text className="mt-0.5 text-xs text-slate-500">
                    {suggestion.secondaryText}
                  </Text>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
