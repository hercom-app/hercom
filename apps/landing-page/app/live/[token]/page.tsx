import type { Metadata } from "next";
import { LiveTripViewer } from "@/components/live/LiveTripViewer";

export const metadata: Metadata = {
  title: "Viaje en vivo",
  description: "Seguimiento en tiempo real de un viaje Hercom.",
  robots: {
    index: false,
    follow: false,
  },
};

type LiveTripPageProps = {
  params: {
    token: string;
  };
};

export default function LiveTripPage({ params }: LiveTripPageProps) {
  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <LiveTripViewer shareToken={params.token} />
    </main>
  );
}
