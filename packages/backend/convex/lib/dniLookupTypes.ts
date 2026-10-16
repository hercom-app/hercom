export type DniLookupResult = {
  firstName: string;
  firstLastName: string;
  secondLastName: string;
  fullName: string;
  documentNumber: string;
  /** ISO YYYY-MM-DD cuando el proveedor la expone (p. ej. VerificaPE). */
  birthDate?: string;
  sex?: string;
  address?: string;
  department?: string;
  province?: string;
  district?: string;
  ubigeo?: string;
  civilStatus?: string;
  verificationDigit?: string;
  dataSource?: string;
};
