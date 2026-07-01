/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as data_peruLocations from "../data/peruLocations.js";
import type * as driverApplications from "../driverApplications.js";
import type * as driverWallets from "../driverWallets.js";
import type * as drivers from "../drivers.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_pricing from "../lib/pricing.js";
import type * as lib_promotions from "../lib/promotions.js";
import type * as lib_regionFilters from "../lib/regionFilters.js";
import type * as lib_serviceStops from "../lib/serviceStops.js";
import type * as notifications from "../notifications.js";
import type * as payments from "../payments.js";
import type * as payouts from "../payouts.js";
import type * as promotions from "../promotions.js";
import type * as reniec from "../reniec.js";
import type * as seed from "../seed.js";
import type * as serviceChecklists from "../serviceChecklists.js";
import type * as serviceOffers from "../serviceOffers.js";
import type * as services from "../services.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "data/peruLocations": typeof data_peruLocations;
  driverApplications: typeof driverApplications;
  driverWallets: typeof driverWallets;
  drivers: typeof drivers;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/constants": typeof lib_constants;
  "lib/pricing": typeof lib_pricing;
  "lib/promotions": typeof lib_promotions;
  "lib/regionFilters": typeof lib_regionFilters;
  "lib/serviceStops": typeof lib_serviceStops;
  notifications: typeof notifications;
  payments: typeof payments;
  payouts: typeof payouts;
  promotions: typeof promotions;
  reniec: typeof reniec;
  seed: typeof seed;
  serviceChecklists: typeof serviceChecklists;
  serviceOffers: typeof serviceOffers;
  services: typeof services;
  users: typeof users;
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
