/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminLogs from "../adminLogs.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as data_countryCatalog from "../data/countryCatalog.js";
import type * as data_peruLocations from "../data/peruLocations.js";
import type * as districtPricingRules from "../districtPricingRules.js";
import type * as driverApplications from "../driverApplications.js";
import type * as driverWallets from "../driverWallets.js";
import type * as drivers from "../drivers.js";
import type * as factiliza from "../factiliza.js";
import type * as geo from "../geo.js";
import type * as http from "../http.js";
import type * as lib_adminAccess from "../lib/adminAccess.js";
import type * as lib_age from "../lib/age.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_commissionTiers from "../lib/commissionTiers.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_dniLookupTypes from "../lib/dniLookupTypes.js";
import type * as lib_driverLocation from "../lib/driverLocation.js";
import type * as lib_driverOfferDiscovery from "../lib/driverOfferDiscovery.js";
import type * as lib_fetchFactilizaDni from "../lib/fetchFactilizaDni.js";
import type * as lib_fetchFactilizaLicense from "../lib/fetchFactilizaLicense.js";
import type * as lib_fetchVerificaPeDni from "../lib/fetchVerificaPeDni.js";
import type * as lib_fetchVerificaPeLicense from "../lib/fetchVerificaPeLicense.js";
import type * as lib_geoDistance from "../lib/geoDistance.js";
import type * as lib_identity from "../lib/identity.js";
import type * as lib_identityServiceErrors from "../lib/identityServiceErrors.js";
import type * as lib_licenseLookupTypes from "../lib/licenseLookupTypes.js";
import type * as lib_markets from "../lib/markets.js";
import type * as lib_money from "../lib/money.js";
import type * as lib_offerLimits from "../lib/offerLimits.js";
import type * as lib_parsePeruBirthDate from "../lib/parsePeruBirthDate.js";
import type * as lib_personName from "../lib/personName.js";
import type * as lib_pricing from "../lib/pricing.js";
import type * as lib_promotions from "../lib/promotions.js";
import type * as lib_regionFilters from "../lib/regionFilters.js";
import type * as lib_reniecDriverQuota from "../lib/reniecDriverQuota.js";
import type * as lib_serviceClosure from "../lib/serviceClosure.js";
import type * as lib_serviceStops from "../lib/serviceStops.js";
import type * as markets from "../markets.js";
import type * as notifications from "../notifications.js";
import type * as payments from "../payments.js";
import type * as payouts from "../payouts.js";
import type * as promotions from "../promotions.js";
import type * as reniec from "../reniec.js";
import type * as reports from "../reports.js";
import type * as seed from "../seed.js";
import type * as seedOwner from "../seedOwner.js";
import type * as serviceChecklists from "../serviceChecklists.js";
import type * as serviceOffers from "../serviceOffers.js";
import type * as serviceRatings from "../serviceRatings.js";
import type * as serviceTracking from "../serviceTracking.js";
import type * as services from "../services.js";
import type * as support from "../support.js";
import type * as users from "../users.js";
import type * as verificape from "../verificape.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adminLogs: typeof adminLogs;
  auth: typeof auth;
  crons: typeof crons;
  "data/countryCatalog": typeof data_countryCatalog;
  "data/peruLocations": typeof data_peruLocations;
  districtPricingRules: typeof districtPricingRules;
  driverApplications: typeof driverApplications;
  driverWallets: typeof driverWallets;
  drivers: typeof drivers;
  factiliza: typeof factiliza;
  geo: typeof geo;
  http: typeof http;
  "lib/adminAccess": typeof lib_adminAccess;
  "lib/age": typeof lib_age;
  "lib/auth": typeof lib_auth;
  "lib/commissionTiers": typeof lib_commissionTiers;
  "lib/constants": typeof lib_constants;
  "lib/dniLookupTypes": typeof lib_dniLookupTypes;
  "lib/driverLocation": typeof lib_driverLocation;
  "lib/driverOfferDiscovery": typeof lib_driverOfferDiscovery;
  "lib/fetchFactilizaDni": typeof lib_fetchFactilizaDni;
  "lib/fetchFactilizaLicense": typeof lib_fetchFactilizaLicense;
  "lib/fetchVerificaPeDni": typeof lib_fetchVerificaPeDni;
  "lib/fetchVerificaPeLicense": typeof lib_fetchVerificaPeLicense;
  "lib/geoDistance": typeof lib_geoDistance;
  "lib/identity": typeof lib_identity;
  "lib/identityServiceErrors": typeof lib_identityServiceErrors;
  "lib/licenseLookupTypes": typeof lib_licenseLookupTypes;
  "lib/markets": typeof lib_markets;
  "lib/money": typeof lib_money;
  "lib/offerLimits": typeof lib_offerLimits;
  "lib/parsePeruBirthDate": typeof lib_parsePeruBirthDate;
  "lib/personName": typeof lib_personName;
  "lib/pricing": typeof lib_pricing;
  "lib/promotions": typeof lib_promotions;
  "lib/regionFilters": typeof lib_regionFilters;
  "lib/reniecDriverQuota": typeof lib_reniecDriverQuota;
  "lib/serviceClosure": typeof lib_serviceClosure;
  "lib/serviceStops": typeof lib_serviceStops;
  markets: typeof markets;
  notifications: typeof notifications;
  payments: typeof payments;
  payouts: typeof payouts;
  promotions: typeof promotions;
  reniec: typeof reniec;
  reports: typeof reports;
  seed: typeof seed;
  seedOwner: typeof seedOwner;
  serviceChecklists: typeof serviceChecklists;
  serviceOffers: typeof serviceOffers;
  serviceRatings: typeof serviceRatings;
  serviceTracking: typeof serviceTracking;
  services: typeof services;
  support: typeof support;
  users: typeof users;
  verificape: typeof verificape;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
