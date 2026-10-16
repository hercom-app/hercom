export type LicenseLookupResult = {
  documentNumber: string;
  fullName: string;
  licenseNumber: string;
  category: string;
  issuedAt: string;
  expiresAt: string;
  status: string;
  restrictions: string;
};

export type LicenseLookupWithSource = LicenseLookupResult & {
  source: "factiliza" | "verificape";
};
