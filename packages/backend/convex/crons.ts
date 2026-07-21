import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "expire stale pending services",
  { minutes: 15 },
  internal.services.expireStalePending,
);

export default crons;
