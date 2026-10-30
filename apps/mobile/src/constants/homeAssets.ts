/** Cambia en cada publicación EAS Update para confirmar en el dispositivo que llegó el bundle. */
export const HOME_UI_REVISION = "10";

const GITHUB_HOME_BASE =
  "https://raw.githubusercontent.com/hercom-app/hercom/main/apps/mobile/assets/images";

/** Requires centralizados para APK / bundle embebido. */
export const SAFETY_CLAY_KEY_GLASS = require("../../assets/images/safety-clay-key-glass.png");

export const SAFETY_TIP_IMAGES = {
  cross: require("../../assets/images/safety/clay-cross.jpg"),
  car: require("../../assets/images/safety/clay-car.jpg"),
  dollar: require("../../assets/images/safety/clay-dollar.jpg"),
} as const;

export const SERVICE_DISCOVERY_IMAGES = {
  premium: require("../../assets/images/services/chofer-premium.png"),
  seguro: require("../../assets/images/services/chofer-seguro.png"),
  flota: require("../../assets/images/services/chofer-flota.png"),
} as const;

/** Fallback remoto: se ve aunque el update no empaquete bien los PNG locales. */
export const HOME_IMAGE_URIS = {
  clay: `${GITHUB_HOME_BASE}/safety-clay-key-glass.png`,
  premium: `${GITHUB_HOME_BASE}/services/chofer-premium.png`,
  seguro: `${GITHUB_HOME_BASE}/services/chofer-seguro.png`,
  flota: `${GITHUB_HOME_BASE}/services/chofer-flota.png`,
} as const;
