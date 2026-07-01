/**
 * División política del Perú para segmentar promociones.
 * Distritos completos disponibles para Lima; otras regiones pueden promocionar
 * a nivel departamento o provincia (district opcional en promoción).
 */
export const PERU_DEPARTMENTS = [
  "Amazonas",
  "Áncash",
  "Apurímac",
  "Arequipa",
  "Ayacucho",
  "Cajamarca",
  "Callao",
  "Cusco",
  "Huancavelica",
  "Huánuco",
  "Ica",
  "Junín",
  "La Libertad",
  "Lambayeque",
  "Lima",
  "Loreto",
  "Madre de Dios",
  "Moquegua",
  "Pasco",
  "Piura",
  "Puno",
  "San Martín",
  "Tacna",
  "Tumbes",
  "Ucayali",
] as const;

export type PeruDepartment = (typeof PERU_DEPARTMENTS)[number];

export const PERU_PROVINCES: Record<PeruDepartment, readonly string[]> = {
  Amazonas: ["Bagua", "Bongará", "Chachapoyas", "Condorcanqui", "Luya", "Rodríguez de Mendoza", "Utcubamba"],
  Áncash: ["Aija", "Antonio Raymondi", "Asunción", "Bolognesi", "Carhuaz", "Carlos Fermín Fitzcarrald", "Casma", "Corongo", "Huaraz", "Huari", "Huarmey", "Huaylas", "Mariscal Luzuriaga", "Ocros", "Pallasca", "Pomabamba", "Recuay", "Santa", "Sihuas", "Yungay"],
  Apurímac: ["Abancay", "Andahuaylas", "Antabamba", "Aymaraes", "Chincheros", "Cotabambas", "Grau"],
  Arequipa: ["Arequipa", "Camana", "Caravelí", "Castilla", "Caylloma", "Condesuyos", "Islay", "La Unión"],
  Ayacucho: ["Cangallo", "Huamanga", "Huanca Sancos", "Huanta", "La Mar", "Lucanas", "Parinacochas", "Paucar del Sara Sara", "Sucre", "Víctor Fajardo", "Vilcas Huamán"],
  Cajamarca: ["Cajabamba", "Cajamarca", "Celendín", "Chota", "Contumazá", "Cutervo", "Hualgayoc", "Jaén", "San Ignacio", "San Marcos", "San Miguel", "San Pablo", "Santa Cruz"],
  Callao: ["Callao"],
  Cusco: ["Acomayo", "Anta", "Calca", "Canas", "Canchis", "Chumbivilcas", "Cusco", "Espinar", "La Convención", "Paruro", "Paucartambo", "Quispicanchi", "Urubamba"],
  Huancavelica: ["Acobamba", "Angaraes", "Castrovirreyna", "Churcampa", "Huancavelica", "Huaytará", "Tayacaja"],
  Huánuco: ["Ambo", "Dos de Mayo", "Huacaybamba", "Huamalíes", "Huánuco", "Lauricocha", "Leoncio Prado", "Marañón", "Pachitea", "Puerto Inca", "Yarowilca"],
  Ica: ["Chincha", "Ica", "Nazca", "Palpa", "Pisco"],
  Junín: ["Chanchamayo", "Chupaca", "Concepción", "Huancayo", "Jauja", "Junín", "Satipo", "Tarma", "Yauli"],
  "La Libertad": ["Ascope", "Bolívar", "Chepén", "Gran Chimú", "Julcán", "Otuzco", "Pacasmayo", "Pataz", "Sánchez Carrión", "Santiago de Chuco", "Trujillo", "Virú"],
  Lambayeque: ["Chiclayo", "Ferreñafe", "Lambayeque"],
  Lima: ["Barranca", "Cajatambo", "Canta", "Cañete", "Huaral", "Huarochirí", "Huaura", "Lima", "Oyón", "Yauyos"],
  Loreto: ["Alto Amazonas", "Datem del Marañón", "Loreto", "Mariscal Ramón Castilla", "Maynas", "Putumayo", "Requena", "Ucayali"],
  "Madre de Dios": ["Manu", "Tahuamanu", "Tambopata"],
  Moquegua: ["General Sánchez Cerro", "Ilo", "Mariscal Nieto"],
  Pasco: ["Daniel Alcides Carrión", "Oxapampa", "Pasco"],
  Piura: ["Ayabaca", "Huancabamba", "Morropón", "Paita", "Piura", "Sechura", "Sullana", "Talara"],
  Puno: ["Azángaro", "Carabaya", "Chucuito", "El Collao", "Huancané", "Lampa", "Melgar", "Moho", "Puno", "San Antonio de Putina", "San Román", "Sandia", "Yunguyo"],
  "San Martín": ["Bellavista", "El Dorado", "Huallaga", "Lamas", "Mariscal Cáceres", "Moyobamba", "Picota", "Rioja", "San Martín", "Tocache"],
  Tacna: ["Candarave", "Jorge Basadre", "Tacna", "Tarata"],
  Tumbes: ["Contralmirante Villar", "Tumbes", "Zarumilla"],
  Ucayali: ["Atalaya", "Coronel Portillo", "Padre Abad", "Purús"],
};

/** Clave "Departamento|Provincia" -> distritos */
export const PERU_DISTRICTS: Record<string, readonly string[]> = {
  "Lima|Lima": [
    "Ancón",
    "Ate",
    "Barranco",
    "Breña",
    "Carabayllo",
    "Chaclacayo",
    "Chorrillos",
    "Cieneguilla",
    "Comas",
    "El Agustino",
    "Independencia",
    "Jesús María",
    "La Molina",
    "La Victoria",
    "Lima",
    "Lince",
    "Los Olivos",
    "Magdalena del Mar",
    "Miraflores",
    "Pueblo Libre",
    "Puente Piedra",
    "Rímac",
    "San Bartolo",
    "San Borja",
    "San Isidro",
    "San Juan de Lurigancho",
    "San Juan de Miraflores",
    "San Luis",
    "San Martín de Porres",
    "San Miguel",
    "Santa Anita",
    "Santa María del Mar",
    "Santa Rosa",
    "Santiago de Surco",
    "Surquillo",
    "Villa El Salvador",
    "Villa María del Triunfo",
  ],
  "Callao|Callao": [
    "Bellavista",
    "Callao",
    "Carmen de la Legua Reynoso",
    "La Perla",
    "La Punta",
    "Ventanilla",
  ],
  "Arequipa|Arequipa": [
    "Arequipa",
    "Alto Selva Alegre",
    "Cayma",
    "Cerro Colorado",
    "Characato",
    "Jacobo Hunter",
    "La Joya",
    "Mariano Melgar",
    "Miraflores",
    "Mollebaya",
    "Paucarpata",
    "Sabandía",
    "Sachaca",
    "Socabaya",
    "Tiabaya",
    "Uchumayo",
    "Yanahuara",
    "Yura",
  ],
  "La Libertad|Trujillo": [
    "Trujillo",
    "El Porvenir",
    "Florencia de Mora",
    "Huanchaco",
    "La Esperanza",
    "Laredo",
    "Moche",
    "Poroto",
    "Salaverry",
    "Simbal",
    "Victor Larco Herrera",
  ],
  "Cusco|Cusco": [
    "Cusco",
    "San Jerónimo",
    "San Sebastián",
    "Santiago",
    "Wanchaq",
  ],
};

export function listProvincesForDepartment(department: string): string[] {
  const provinces = PERU_PROVINCES[department as PeruDepartment];
  return provinces ? [...provinces] : [];
}

export function listDistrictsForProvince(
  department: string,
  province: string,
): string[] {
  const districts = PERU_DISTRICTS[`${department}|${province}`];
  return districts ? [...districts] : [];
}

function normalizeAdminName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(region|department|departamento|province|provincia|metropolitan)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function findBestCatalogMatch(
  candidate: string | undefined,
  options: readonly string[],
): string | undefined {
  if (candidate === undefined || candidate.trim() === "") {
    return undefined;
  }
  const normalized = normalizeAdminName(candidate);
  const exact = options.find((option) => normalizeAdminName(option) === normalized);
  if (exact !== undefined) {
    return exact;
  }
  return options.find((option) => {
    const optionNorm = normalizeAdminName(option);
    return normalized.includes(optionNorm) || optionNorm.includes(normalized);
  });
}

/** Mapea nombres de Google Geocoding al catálogo oficial de departamentos. */
export function matchDepartment(candidate: string | undefined): string | undefined {
  return findBestCatalogMatch(candidate, PERU_DEPARTMENTS);
}

export function matchProvince(
  department: string,
  candidate: string | undefined,
): string | undefined {
  return findBestCatalogMatch(candidate, listProvincesForDepartment(department));
}

export function matchDistrict(
  department: string,
  province: string,
  candidate: string | undefined,
): string | undefined {
  return findBestCatalogMatch(
    candidate,
    listDistrictsForProvince(department, province),
  );
}

export type PeruRegionMatch = {
  department: string;
  province?: string;
  district?: string;
};

/**
 * Resuelve departamento/provincia/distrito a partir de componentes administrativos
 * típicos de Google Maps en Perú.
 */
export function resolvePeruRegionFromGoogleComponents(components: {
  department?: string;
  province?: string;
  districtCandidates: string[];
}): PeruRegionMatch | null {
  const department = matchDepartment(components.department);
  if (department === undefined) {
    return null;
  }

  const province =
    matchProvince(department, components.province) ??
    (listProvincesForDepartment(department).length === 1
      ? listProvincesForDepartment(department)[0]
      : undefined);

  let district: string | undefined;
  if (province !== undefined) {
    for (const candidate of components.districtCandidates) {
      const matched = matchDistrict(department, province, candidate);
      if (matched !== undefined) {
        district = matched;
        break;
      }
    }
  }

  return {
    department,
    ...(province !== undefined ? { province } : {}),
    ...(district !== undefined ? { district } : {}),
  };
}
