import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "expire stale pending services",
  { minutes: 15 },
  internal.services.expireStalePending,
);

crons.daily(
  "purge expired route archives",
  { hourUTC: 9, minuteUTC: 0 },
  internal.serviceRouteArchives.purgeExpired,
);

export default crons;
