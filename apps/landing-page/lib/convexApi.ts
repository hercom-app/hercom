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

export const submitCorporateQuote = makeFunctionReference<
  "action",
  {
    companyName: string;
    contactName: string;
    ruc: string;
    email: string;
    phone: string;
    originDepartment: string;
    originProvince: string;
    originDistrict: string;
    destinationDepartment: string;
    destinationProvince: string;
    destinationDistrict: string;
    serviceStart: string;
    serviceEnd: string;
    serviceHours: number;
    driverCount: number;
    detail: string;
  },
  { id: string; emailSent: boolean }
>("corporateQuotes:submit");

export const getByShareToken = makeFunctionReference<
  "query",
  { shareToken: string },
  SharedLiveTrip | null
>("serviceTracking:getByShareToken");
