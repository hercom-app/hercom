export type DriverRegistrationFieldKey =
  | "dni"
  | "dniReniec"
  | "names"
  | "birthDate"
  | "sex"
  | "department"
  | "province"
  | "district"
  | "licenseNumber"
  | "experienceYears"
  | "vehicleBodyType"
  | "licenseFront"
  | "licenseBack"
  | "licenseSelfie"
  | "licenseDigital"
  | "conductorRecord"
  | "cul"
  | "personalDataConsent";

export type DriverRegistrationValidationInput = {
  dni: string;
  dniCheckPending: boolean;
  dniTakenByOther: boolean;
  dniReniecValidated: boolean;
  reniecManualFallback: boolean;
  firstName: string;
  firstLastName: string;
  secondLastName: string;
  sex: "M" | "F" | null;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  birthDateValid: boolean;
  birthDateAdult: boolean;
  department: string;
  province: string;
  district: string;
  licenseNumber: string;
  yearsDrivingExperience: string;
  vehicleBodyType: "auto" | "camioneta" | null;
  licenseFormat: "physical" | "digital";
  licenseFront: unknown | null;
  licenseBack: unknown | null;
  licenseSelfie: unknown | null;
  licenseDigital: unknown | null;
  conductorRecordPdf: unknown | null;
  culPdf: unknown | null;
  personalDataConsent: boolean;
};

function identityConfirmed(input: DriverRegistrationValidationInput): boolean {
  return input.dniReniecValidated || input.reniecManualFallback;
}

export function getInvalidDriverRegistrationFields(
  input: DriverRegistrationValidationInput,
): Set<DriverRegistrationFieldKey> {
  const invalid = new Set<DriverRegistrationFieldKey>();

  if (!/^\d{8}$/.test(input.dni.trim())) {
    invalid.add("dni");
  } else {
    if (input.dniCheckPending || input.dniTakenByOther) {
      invalid.add("dni");
    } else if (!identityConfirmed(input)) {
      invalid.add("dni");
      invalid.add("dniReniec");
    }
  }

  if (identityConfirmed(input)) {
    if (
      input.firstName.trim() === "" ||
      input.firstLastName.trim() === "" ||
      input.secondLastName.trim() === ""
    ) {
      invalid.add("names");
    }
  }

  if (!input.birthDateValid || !input.birthDateAdult) {
    invalid.add("birthDate");
  }

  if (input.sex === null) {
    invalid.add("sex");
  }

  if (input.department === "") {
    invalid.add("department");
  }
  if (input.province === "") {
    invalid.add("province");
  }
  if (input.district === "") {
    invalid.add("district");
  }

  if (input.licenseNumber.trim() === "") {
    invalid.add("licenseNumber");
  }

  const years = Number.parseInt(input.yearsDrivingExperience.trim(), 10);
  if (!Number.isFinite(years) || years < 0 || years > 60) {
    invalid.add("experienceYears");
  }

  if (input.vehicleBodyType === null) {
    invalid.add("vehicleBodyType");
  }

  if (input.licenseFormat === "physical") {
    if (input.licenseFront === null) {
      invalid.add("licenseFront");
    }
    if (input.licenseBack === null) {
      invalid.add("licenseBack");
    }
    if (input.licenseSelfie === null) {
      invalid.add("licenseSelfie");
    }
  } else {
    if (input.licenseDigital === null) {
      invalid.add("licenseDigital");
    }
    if (input.licenseSelfie === null) {
      invalid.add("licenseSelfie");
    }
  }

  if (input.conductorRecordPdf === null) {
    invalid.add("conductorRecord");
  }
  if (input.culPdf === null) {
    invalid.add("cul");
  }
  if (!input.personalDataConsent) {
    invalid.add("personalDataConsent");
  }

  return invalid;
}

/** Texto corto y accionable debajo del campo (Material / WCAG 3.3.3). */
export function getDriverRegistrationFieldErrors(
  input: DriverRegistrationValidationInput,
): Map<DriverRegistrationFieldKey, string> {
  const errors = new Map<DriverRegistrationFieldKey, string>();
  const invalid = getInvalidDriverRegistrationFields(input);

  if (invalid.has("dni")) {
    if (!/^\d{8}$/.test(input.dni.trim())) {
      errors.set("dni", "Ingresa tu DNI de 8 dígitos.");
    } else if (input.dniCheckPending) {
      errors.set("dni", "Espera a que termine la verificación del DNI.");
    } else if (input.dniTakenByOther) {
      errors.set("dni", "Este DNI ya está en otra cuenta. Usa otro DNI.");
    } else if (!identityConfirmed(input)) {
      errors.set("dni", "Debes validar el DNI con RENIEC o ingresar tus datos manualmente si el servicio no está disponible.");
    }
  }
  if (invalid.has("dniReniec")) {
    errors.set(
      "dniReniec",
      "Toca «Validar DNI» para autocompletar tus nombres.",
    );
  }
  if (invalid.has("names")) {
    errors.set(
      "names",
      input.reniecManualFallback
        ? "Completa nombres y apellidos tal como figuran en tu DNI."
        : "Tus nombres deben llenarse al validar el DNI. Vuelve a validar si están vacíos.",
    );
  }
  if (invalid.has("birthDate")) {
    if (!input.birthDateValid) {
      errors.set("birthDate", "Ingresa tu fecha de nacimiento (día, mes y año).");
    } else {
      errors.set("birthDate", "Debes ser mayor de 18 años.");
    }
  }
  if (invalid.has("sex")) {
    errors.set("sex", "Selecciona tu sexo.");
  }
  if (invalid.has("department")) {
    errors.set("department", "Selecciona tu departamento.");
  }
  if (invalid.has("province")) {
    errors.set("province", "Selecciona tu provincia.");
  }
  if (invalid.has("district")) {
    errors.set("district", "Selecciona tu distrito.");
  }
  if (invalid.has("licenseNumber")) {
    errors.set("licenseNumber", "Ingresa el número de tu brevete.");
  }
  if (invalid.has("experienceYears")) {
    errors.set("experienceYears", "Indica tus años manejando (0 a 60).");
  }
  if (invalid.has("vehicleBodyType")) {
    errors.set("vehicleBodyType", "Indica si manejas auto o camioneta.");
  }
  if (invalid.has("licenseFront")) {
    errors.set("licenseFront", "Sube la foto del anverso del brevete.");
  }
  if (invalid.has("licenseBack")) {
    errors.set("licenseBack", "Sube la foto del reverso del brevete.");
  }
  if (invalid.has("licenseSelfie")) {
    errors.set(
      "licenseSelfie",
      "Sube la selfie sosteniendo el brevete (impreso si es digital).",
    );
  }
  if (invalid.has("licenseDigital")) {
    errors.set("licenseDigital", "Sube el PDF o imagen del brevete digital.");
  }
  if (invalid.has("conductorRecord")) {
    errors.set("conductorRecord", "Sube el PDF del récord de conductor.");
  }
  if (invalid.has("cul")) {
    errors.set("cul", "Sube el PDF del CUL.");
  }
  if (invalid.has("personalDataConsent")) {
    errors.set(
      "personalDataConsent",
      "Marca la casilla para autorizar el uso de tus datos.",
    );
  }

  return errors;
}
