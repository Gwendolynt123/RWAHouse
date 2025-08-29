// Country and city mapping data
// Display actual names on interface, but use numeric codes for on-chain storage

export interface Country {
  code: number;
  name: string;
}

export interface City {
  code: number;
  name: string;
  countryCode: number;
}

// Country code mapping
export const COUNTRIES: Country[] = [
  { code: 1, name: 'United States' },
  { code: 86, name: 'China' },
  { code: 44, name: 'United Kingdom' },
  { code: 81, name: 'Japan' },
  { code: 33, name: 'France' },
  { code: 49, name: 'Germany' },
  { code: 39, name: 'Italy' },
  { code: 7, name: 'Russia' },
  { code: 91, name: 'India' },
  { code: 55, name: 'Brazil' },
  { code: 61, name: 'Australia' },
  { code: 82, name: 'South Korea' },
  { code: 65, name: 'Singapore' },
  { code: 852, name: 'Hong Kong' },
  { code: 41, name: 'Switzerland' },
];

// City code mapping - organized by country
export const CITIES: City[] = [
  // United States (1)
  { code: 1001, name: 'New York', countryCode: 1 },
  { code: 1002, name: 'Los Angeles', countryCode: 1 },
  { code: 1003, name: 'Chicago', countryCode: 1 },
  { code: 1004, name: 'Houston', countryCode: 1 },
  { code: 1005, name: 'San Francisco', countryCode: 1 },
  { code: 1006, name: 'Seattle', countryCode: 1 },
  { code: 1007, name: 'Miami', countryCode: 1 },
  { code: 1008, name: 'Boston', countryCode: 1 },

  // China (86)
  { code: 8601, name: 'Beijing', countryCode: 86 },
  { code: 8602, name: 'Shanghai', countryCode: 86 },
  { code: 8603, name: 'Guangzhou', countryCode: 86 },
  { code: 8604, name: 'Shenzhen', countryCode: 86 },
  { code: 8605, name: 'Hangzhou', countryCode: 86 },
  { code: 8606, name: 'Nanjing', countryCode: 86 },
  { code: 8607, name: 'Chengdu', countryCode: 86 },
  { code: 8608, name: 'Wuhan', countryCode: 86 },

  // United Kingdom (44)
  { code: 4401, name: 'London', countryCode: 44 },
  { code: 4402, name: 'Manchester', countryCode: 44 },
  { code: 4403, name: 'Birmingham', countryCode: 44 },
  { code: 4404, name: 'Liverpool', countryCode: 44 },
  { code: 4405, name: 'Edinburgh', countryCode: 44 },

  // Japan (81)
  { code: 8101, name: 'Tokyo', countryCode: 81 },
  { code: 8102, name: 'Osaka', countryCode: 81 },
  { code: 8103, name: 'Kyoto', countryCode: 81 },
  { code: 8104, name: 'Yokohama', countryCode: 81 },
  { code: 8105, name: 'Nagoya', countryCode: 81 },

  // France (33)
  { code: 3301, name: 'Paris', countryCode: 33 },
  { code: 3302, name: 'Lyon', countryCode: 33 },
  { code: 3303, name: 'Marseille', countryCode: 33 },
  { code: 3304, name: 'Nice', countryCode: 33 },

  // Germany (49)
  { code: 4901, name: 'Berlin', countryCode: 49 },
  { code: 4902, name: 'Munich', countryCode: 49 },
  { code: 4903, name: 'Hamburg', countryCode: 49 },
  { code: 4904, name: 'Frankfurt', countryCode: 49 },

  // Singapore (65)
  { code: 6501, name: 'Singapore', countryCode: 65 },

  // Hong Kong (852)
  { code: 85201, name: 'Hong Kong', countryCode: 852 },

  // Switzerland (41)
  { code: 4101, name: 'Zurich', countryCode: 41 },
  { code: 4102, name: 'Geneva', countryCode: 41 },
];

// Helper functions
export const getCountryByCode = (code: number): Country | undefined => {
  return COUNTRIES.find(country => country.code === code);
};

export const getCityByCode = (code: number): City | undefined => {
  return CITIES.find(city => city.code === code);
};

export const getCitiesByCountry = (countryCode: number): City[] => {
  return CITIES.filter(city => city.countryCode === countryCode);
};

export const getCountryName = (code: number): string => {
  const country = getCountryByCode(code);
  return country ? country.name : `Unknown Country (${code})`;
};

export const getCityName = (code: number): string => {
  const city = getCityByCode(code);
  return city ? city.name : `Unknown City (${code})`;
};