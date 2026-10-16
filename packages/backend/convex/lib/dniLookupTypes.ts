export type DniLookupResult = {
  firstName: string;
  firstLastName: string;
  secondLastName: string;
  fullName: string;
  documentNumber: string;
  /** ISO YYYY-MM-DD cuando el proveedor la devuelve (p. ej. VerificaPE). */
  birthDate?: string;
  sex?: string;
};
