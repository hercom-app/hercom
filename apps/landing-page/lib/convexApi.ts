import { makeFunctionReference } from "convex/server";

export type SharedLiveTrip = {
  status: string;
  isLive: boolean;
  origin: { address: string; lat: number; lng: number };
  destination: { address: string; lat: number; lng: number };
  shareToken: string;
  lat: number | null;
  lng: number | null;
  updatedAt: number | null;
  trail: Array<{ lat: number; lng: number; t: number }>;
};

export const getByShareToken = makeFunctionReference<
  "query",
  { shareToken: string },
  SharedLiveTrip | null
>("serviceTracking:getByShareToken");
