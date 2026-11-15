/**
 * Confirma que la política y los términos exportados son estables
 * (móvil y landing importan el mismo módulo @proyecto/legal).
 */
import {
  DRIVER_PERSONAL_DATA_CONSENT,
  PRIVACY_POLICY,
  TERMS_OF_USE,
} from "../legalCopy.ts";

function digest(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16);
}

const checks = [
  ["TERMS_OF_USE.title", TERMS_OF_USE.title, "Términos de Uso"],
  ["PRIVACY_POLICY.title", PRIVACY_POLICY.title, "Política de Privacidad"],
  [
    "DRIVER_PERSONAL_DATA_CONSENT.version",
    DRIVER_PERSONAL_DATA_CONSENT.version,
    "2026-10",
  ],
];

for (const [name, actual, expected] of checks) {
  if (actual !== expected) {
    console.error(`FAIL ${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    process.exit(1);
  }
}

console.log("OK @proyecto/legal exports");
console.log(`  TERMS_OF_USE.body chars: ${TERMS_OF_USE.body.length} digest: ${digest(TERMS_OF_USE.body)}`);
console.log(`  PRIVACY_POLICY.body chars: ${PRIVACY_POLICY.body.length} digest: ${digest(PRIVACY_POLICY.body)}`);
console.log(
  `  DRIVER_PERSONAL_DATA_CONSENT.fullText chars: ${DRIVER_PERSONAL_DATA_CONSENT.fullText.length} digest: ${digest(DRIVER_PERSONAL_DATA_CONSENT.fullText)}`,
);