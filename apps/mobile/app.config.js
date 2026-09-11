const base = require("./app.json");

function invokedByEasCli() {
  return process.argv.some(
    (arg) =>
      arg.includes("eas-cli") || /(?:^|[\\/])eas(?:\.cmd)?$/i.test(arg),
  );
}

/**
 * En Expo Go, omitir `owner` y apagar updates evita que Metro pida login
 * para firmar el manifiesto. El `projectId` se deja siempre: `eas build`
 * lo necesita incluso cuando evalúa esta config fuera del worker de EAS.
 */
module.exports = () => {
  const expo = { ...base.expo };
  const keepEasRuntime =
    process.env.EAS_BUILD === "true" || invokedByEasCli();

  if (!keepEasRuntime) {
    delete expo.owner;
    expo.updates = {
      ...(expo.updates ?? {}),
      enabled: false,
    };
  }
  return { expo };
};
