export type AddressDraft = {
  address: string;
  lat: number | null;
  lng: number | null;
  placeId: string | null;
};

export function createEmptyAddressDraft(): AddressDraft {
  return {
    address: "",
    lat: null,
    lng: null,
    placeId: null,
  };
}

export function addressDraftFromText(address: string): AddressDraft {
  return {
    address,
    lat: null,
    lng: null,
    placeId: null,
  };
}

export function toServiceLocation(draft: AddressDraft): {
  address: string;
  lat: number;
  lng: number;
} {
  return {
    address: draft.address.trim(),
    lat: draft.lat ?? 0,
    lng: draft.lng ?? 0,
  };
}
