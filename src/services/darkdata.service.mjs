/**
 * Service pour calculer les 4 "dark data" automatiquement
 */

// Algorithme de Luhn
const isValidLuhn = (cardNumber) => {
  if (!cardNumber) return false;
  const digits = cardNumber.replace(/\D/g, '');
  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = parseInt(digits[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};

// Extraction code pays IBAN
const extractIBANCountry = (iban) => {
  if (!iban) return null;
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  return cleaned.substring(0, 2);
};

// Extraction code pays téléphone
const extractPhoneCountry = (phone) => {
  if (!phone) return null;
  const prefixMap = {
    '+33': 'FR',
    '+1': 'US',
    '+44': 'UK',
    '+49': 'DE',
    '+34': 'ES',
    '+39': 'IT',
    '+98': 'IR',
    '+86': 'CN',
    '+81': 'JP',
    '+91': 'IN',
    '+7': 'RU',
    '+55': 'BR',
    '+52': 'MX',
    '+61': 'AU',
    '+82': 'KR'
  };
  const match = phone.match(/^\+(\d{1,3})/);
  if (!match) return null;
  const prefix = `+${match[1]}`;
  for (const [key, value] of Object.entries(prefixMap)) {
    if (prefix.startsWith(key)) return value;
  }
  return null;
};

// Extraction code pays location
const extractLocationCountry = (location) => {
  if (!location) return null;
  const countryMap = {
    Iran: 'IR',
    France: 'FR',
    USA: 'US',
    'United States': 'US',
    Germany: 'DE',
    Spain: 'ES',
    Italy: 'IT',
    China: 'CN',
    Japan: 'JP',
    India: 'IN',
    Russia: 'RU',
    Brazil: 'BR',
    Mexico: 'MX',
    Australia: 'AU',
    'South Korea': 'KR',
    UK: 'UK',
    'United Kingdom': 'UK'
  };
  const upperLoc = location.toUpperCase();
  for (const [country, code] of Object.entries(countryMap)) {
    if (upperLoc.includes(country.toUpperCase())) return code;
  }
  return null;
};

// Détection script Unicode
const detectUnicodeScript = (text) => {
  if (!text) return 'unknown';
  const scripts = {
    latin: 0, arabic: 0, cyrillic: 0, cjk: 0
  };

  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if ((code >= 0x0041 && code <= 0x007A) || (code >= 0x00C0 && code <= 0x024F)) {
      scripts.latin += 1;
    } else if ((code >= 0x0600 && code <= 0x06FF) || (code >= 0x0750 && code <= 0x077F)) {
      scripts.arabic += 1;
    } else if (code >= 0x0400 && code <= 0x04FF) {
      scripts.cyrillic += 1;
    } else if ((code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3040 && code <= 0x30FF)) {
      scripts.cjk += 1;
    }
  }

  const total = Object.values(scripts).reduce((a, b) => a + b, 0);
  if (total === 0) return 'unknown';

  const threshold = total * 0.7;
  if (scripts.latin >= threshold) return 'latin';
  if (scripts.arabic >= threshold) return 'arabic';
  if (scripts.cyrillic >= threshold) return 'cyrillic';
  if (scripts.cjk >= threshold) return 'cjk';
  return 'mixed';
};

// Distance culturelle
const calculateCulturalDistance = (country1, country2) => {
  if (!country1 || !country2) return 1;
  if (country1 === country2) return 0;

  const regions = {
    western: ['FR', 'DE', 'ES', 'IT', 'UK', 'US', 'AU'],
    eastern: ['CN', 'JP', 'KR'],
    middleEast: ['IR', 'SA', 'AE'],
    slavic: ['RU', 'PL', 'UA'],
    latinAmerica: ['BR', 'MX', 'AR']
  };

  let region1 = null;
  let region2 = null;
  for (const [region, countries] of Object.entries(regions)) {
    if (countries.includes(country1)) region1 = region;
    if (countries.includes(country2)) region2 = region;
  }

  if (region1 && region2 && region1 === region2) return 0.3;
  return 0.8;
};

/**
 * 1. FINANCIAL RISK SCORE (0-100)
 */
export const calculateFinancialRiskScore = (data) => {
  // Cohérence géographique (IBAN country vs phone prefix vs location)
  const ibanCountry = extractIBANCountry(data.iban);
  const phoneCountry = extractPhoneCountry(data.phone_number);
  const locationCountry = extractLocationCountry(data.user?.location);

  let geoCoherence = 0;
  if (ibanCountry && phoneCountry && locationCountry) {
    if (ibanCountry === phoneCountry && phoneCountry === locationCountry) {
      geoCoherence = 100;
    } else if (ibanCountry === phoneCountry || phoneCountry === locationCountry) {
      geoCoherence = 50;
    } else {
      geoCoherence = 0;
    }
  } else {
    geoCoherence = 30; // Données manquantes
  }

  // Validation carte (Luhn)
  const cardValid = isValidLuhn(data.credit_card?.card_number) ? 100 : 0;

  // Expiration carte (> 6 mois)
  let expirationOk = 0;
  if (data.credit_card?.expiration_date) {
    const [month, year] = data.credit_card.expiration_date.split('/');
    const expDate = new Date(`20${year}`, parseInt(month, 10) - 1);
    const now = new Date();
    const monthsRemaining = (expDate - now) / (1000 * 60 * 60 * 24 * 30);
    expirationOk = monthsRemaining > 6 ? 100 : 0;
  }

  const score = (geoCoherence * 0.4) + (cardValid * 0.4) + (expirationOk * 0.2);
  return Math.round(score);
};

/**
 * 2. BEHAVIORAL PROFILE
 */
export const calculateBehavioralProfile = (data) => {
  const userName = data.user?.name || '';
  const randomName = data.random_name || '';
  const location = data.user?.location || '';

  // is_synthetic: random_name différent de user.name
  const isSynthetic = userName.toLowerCase() !== randomName.toLowerCase();

  // cultural_coherence: cohérence name/location
  const nameScript = detectUnicodeScript(userName);
  const locationCountry = extractLocationCountry(location);

  let culturalCoherence = 0.5;
  if (nameScript === 'arabic' && locationCountry === 'IR') culturalCoherence = 1;
  else if (nameScript === 'latin' && ['FR', 'US', 'UK'].includes(locationCountry)) culturalCoherence = 1;
  else if (nameScript === 'cyrillic' && locationCountry === 'RU') culturalCoherence = 1;
  else if (nameScript === 'mixed') culturalCoherence = 0.3;

  // name_pattern
  const namePattern = nameScript;

  return {
    is_synthetic: isSynthetic,
    cultural_coherence: culturalCoherence,
    name_pattern: namePattern
  };
};

/**
 * 3. CULTURAL DIVERSITY INDEX (0-1)
 */
export const calculateCulturalDiversityIndex = (data) => {
  const userName = data.user?.name || '';
  const location = data.user?.location || '';

  const nameScript = detectUnicodeScript(userName);
  const locationCountry = extractLocationCountry(location);

  // Mapping script -> pays typiques
  const scriptCountryMap = {
    arabic: 'IR',
    latin: 'FR',
    cyrillic: 'RU',
    cjk: 'CN'
  };

  const expectedCountry = scriptCountryMap[nameScript];

  if (!expectedCountry || !locationCountry) return 0.5;

  const distance = calculateCulturalDistance(expectedCountry, locationCountry);
  return parseFloat(distance.toFixed(2));
};

/**
 * 4. METADATA ENRICHMENT
 */
export const calculateMetadataEnrichment = (data) => {
  // Completeness score (% de champs remplis)
  const fields = [
    data.user?.name,
    data.user?.email,
    data.user?.gender,
    data.user?.location,
    data.user?.picture,
    data.phone_number,
    data.iban,
    data.credit_card?.card_number,
    data.credit_card?.card_type,
    data.credit_card?.expiration_date,
    data.credit_card?.cvv,
    data.random_name,
    data.pet,
    data.quote?.content,
    data.quote?.author,
    data.joke?.type,
    data.joke?.content
  ];

  const filledFields = fields.filter((f) => f && f.toString().trim() !== '').length;
  const completenessScore = Math.round((filledFields / fields.length) * 100);

  // Data quality flags
  const qualityFlags = [];
  if (data.user?.email && data.user.email.includes('@')) qualityFlags.push('valid_email');
  if (data.iban && data.iban.length >= 15) qualityFlags.push('valid_iban');
  if (isValidLuhn(data.credit_card?.card_number)) qualityFlags.push('valid_card_luhn');

  return {
    completeness_score: completenessScore,
    ingestion_timestamp: new Date(),
    data_quality_flags: qualityFlags,
    source: 'rust_pipeline_v1'
  };
};

/**
 * Fonction principale pour enrichir les données
 */
export const enrichWithDarkData = (rawData) => ({
  ...rawData,
  dark_data: {
    financial_risk_score: calculateFinancialRiskScore(rawData),
    behavioral_profile: calculateBehavioralProfile(rawData),
    cultural_diversity_index: calculateCulturalDiversityIndex(rawData),
    metadata_enrichment: calculateMetadataEnrichment(rawData)
  }
});
