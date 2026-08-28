import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export const convexClient =
  convexUrl !== undefined && convexUrl !== ""
    ? new ConvexReactClient(convexUrl)
    : null;

export function isConvexConfigured(): boolean {
  return convexClient !== null;
}
