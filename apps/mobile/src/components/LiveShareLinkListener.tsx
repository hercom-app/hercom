import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import { LiveTripMapModal } from "./LiveTripMapModal";

function extractShareToken(url: string | null): string | null {
  if (url === null || url.trim() === "") {
    return null;
  }
  // choferes://live/TOKEN  |  exp://.../--/live/TOKEN  |  https://.../live/TOKEN
  const match = url.match(/(?:live\/|shareToken=)([a-z0-9]{8,20})/i);
  return match?.[1]?.toLowerCase() ?? null;
}

/**
 * Abre el mapa en vivo cuando llega un deep link choferes://live/{token}.
 */
export function LiveShareLinkListener() {
  const [shareToken, setShareToken] = useState<string | null>(null);

  useEffect(() => {
    function handleUrl(url: string | null) {
      const token = extractShareToken(url);
      if (token !== null) {
        setShareToken(token);
      }
    }

    void Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener("url", (event) => {
      handleUrl(event.url);
    });
    return () => subscription.remove();
  }, []);

  return (
    <LiveTripMapModal
      visible={shareToken !== null}
      shareToken={shareToken ?? undefined}
      onClose={() => setShareToken(null)}
      title="Viaje compartido"
    />
  );
}
