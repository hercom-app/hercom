const base = require("./app.json");

/**
 * En desarrollo con Expo Go, omitir owner + EAS projectId evita que Metro pida
 * login interactivo para firmar el manifiesto (causa "Something went wrong").
 * EAS Build sigue usando app.json completo vía EAS_BUILD=true.
 */
module.exports = () => {
  const expo = { ...base.expo };
  if (process.env.EAS_BUILD !== "true") {
    delete expo.owner;
    if (expo.extra?.eas) {
      const { eas: _eas, ...restExtra } = expo.extra;
      expo.extra = Object.keys(restExtra).length > 0 ? restExtra : undefined;
    }
  }
  return { expo };
};
