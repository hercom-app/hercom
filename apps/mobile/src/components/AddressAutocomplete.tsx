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
};

const DEBOUNCE_MS = 320;
const MAX_VISIBLE_SUGGESTIONS = 5;
/** Altura aproximada de cada fila (título + subtítulo + padding). */
const SUGGESTION_ROW_HEIGHT = 62;

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
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const sessionTokenRef = useRef(createPlacesSessionToken());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const placesEnabled = isGooglePlacesConfigured();
  const canSearch = placesEnabled;

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isFocused || !canSearch) {
      setSuggestions([]);
      setLoading(false);
      setSearchError(null);
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
  }, [canSearch, gpsCenter, isFocused, region, value]);

  async function handleSelectSuggestion(suggestion: PlaceSuggestion) {
    // Cierra la lista de inmediato (si no, al rellenar el texto se vuelve a buscar).
    setIsFocused(false);
    setSuggestions([]);
    setSearchError(null);
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
    onChangeText(nextValue);
    if (selectedPlaceId !== null && onPlaceCleared !== undefined) {
      onPlaceCleared();
    }
  }

  const showSuggestions = isFocused && suggestions.length > 0 && !disabled;

  return (
    <View className="relative z-20">
      <TextInput
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        editable={!disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setTimeout(() => {
            setIsFocused(false);
            setSuggestions([]);
          }, 180);
        }}
        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
      />

      {!placesEnabled && (
        <Text className="mt-1 text-[11px] text-amber-700">
          Sin API key de Google: puedes escribir la dirección manualmente.
        </Text>
      )}

      {loading && (
        <View className="mt-2 flex-row items-center gap-2">
          <ActivityIndicator color="#0369A1" size="small" />
          <Text className="text-xs text-slate-500">Buscando direcciones...</Text>
        </View>
      )}

      {searchError !== null && !loading && (
        <Text className="mt-1 text-xs text-amber-700">{searchError}</Text>
      )}

      {showSuggestions && (
        <View className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <ScrollView
            style={{
              maxHeight: MAX_VISIBLE_SUGGESTIONS * SUGGESTION_ROW_HEIGHT,
            }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={suggestions.length > MAX_VISIBLE_SUGGESTIONS}
          >
            {suggestions.map((suggestion) => (
              <Pressable
                key={suggestion.placeId}
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
