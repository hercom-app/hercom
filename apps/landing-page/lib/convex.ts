import { ConvexReactClient } from "convex/react";

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL !== undefined &&
  process.env.NEXT_PUBLIC_CONVEX_URL !== ""
    ? process.env.NEXT_PUBLIC_CONVEX_URL
    : "https://lovable-kudu-343.convex.cloud";

export const convexClient =
  convexUrl !== undefined && convexUrl !== ""
    ? new ConvexReactClient(convexUrl)
    : null;

export function isConvexConfigured(): boolean {
  return convexClient !== null;
}
