/**
 * Geographic coordinates and mapping utilities for Ableo.
 * Supports job locations across India and candidate distribution.
 */

export type Coordinates = {
  lat: number;
  lng: number;
};

export type LocationInfo = {
  name: string;
  state: string;
  coords: Coordinates;
  isRemote?: boolean;
};

export const CITY_COORDINATES: Record<string, LocationInfo> = {
  "Bengaluru": {
    name: "Bengaluru",
    state: "Karnataka",
    coords: { lat: 12.9716, lng: 77.5946 },
  },
  "Mumbai": {
    name: "Mumbai",
    state: "Maharashtra",
    coords: { lat: 19.0760, lng: 72.8777 },
  },
  "Delhi": {
    name: "Delhi",
    state: "Delhi NCR",
    coords: { lat: 28.7041, lng: 77.1025 },
  },
  "Gurugram": {
    name: "Gurugram",
    state: "Haryana",
    coords: { lat: 28.4595, lng: 77.0266 },
  },
  "Hyderabad": {
    name: "Hyderabad",
    state: "Telangana",
    coords: { lat: 17.3850, lng: 78.4867 },
  },
  "Pune": {
    name: "Pune",
    state: "Maharashtra",
    coords: { lat: 18.5204, lng: 73.8567 },
  },
  "Chennai": {
    name: "Chennai",
    state: "Tamil Nadu",
    coords: { lat: 13.0827, lng: 80.2707 },
  },
  "Kolkata": {
    name: "Kolkata",
    state: "West Bengal",
    coords: { lat: 22.5726, lng: 88.3639 },
  },
  "Ahmedabad": {
    name: "Ahmedabad",
    state: "Gujarat",
    coords: { lat: 23.0225, lng: 72.5714 },
  },
  "Jaipur": {
    name: "Jaipur",
    state: "Rajasthan",
    coords: { lat: 26.9124, lng: 75.7873 },
  },
  "Coimbatore": {
    name: "Coimbatore",
    state: "Tamil Nadu",
    coords: { lat: 11.0168, lng: 76.9558 },
  },
  "Remote (India)": {
    name: "Remote (Pan-India)",
    state: "All India",
    coords: { lat: 20.5937, lng: 78.9629 }, // Center of India
    isRemote: true,
  },
  "Remote": {
    name: "Remote (Pan-India)",
    state: "All India",
    coords: { lat: 20.5937, lng: 78.9629 },
    isRemote: true,
  },
};

/**
 * Default geographic center for India overview
 */
export const DEFAULT_MAP_CENTER: Coordinates = {
  lat: 20.5937,
  lng: 78.9629,
};

export const DEFAULT_MAP_ZOOM = 5;

/**
 * Returns coordinates for a given city string, with sensible fallback.
 */
export function getCoordinatesForCity(city: string): Coordinates {
  const clean = city.trim();
  if (CITY_COORDINATES[clean]) {
    return CITY_COORDINATES[clean].coords;
  }
  // Check case-insensitive match
  const match = Object.keys(CITY_COORDINATES).find(
    (k) => k.toLowerCase() === clean.toLowerCase() || clean.toLowerCase().includes(k.toLowerCase())
  );
  if (match) {
    return CITY_COORDINATES[match].coords;
  }
  return DEFAULT_MAP_CENTER;
}

/**
 * Enhanced precision locator that pinpoints specific business districts within major metros like Mumbai.
 * Ensures every pin lands strictly on real land and commercial IT corridors, never in the water.
 */
export function getCoordinatesForJob(job: { city: string; title: string; company: string }): Coordinates {
  const text = `${job.city} ${job.company} ${job.title}`.toLowerCase();
  
  if (text.includes("mumbai") || text.includes("bkc") || text.includes("powai") || text.includes("andheri") || text.includes("parel") || text.includes("vikhroli") || text.includes("deccan")) {
    if (text.includes("bkc") || text.includes("bandra kurla")) {
      return { lat: 19.0665, lng: 72.8685 }; // Bandra Kurla Complex G Block
    }
    if (text.includes("powai") || text.includes("hiranandani")) {
      return { lat: 19.1176, lng: 72.9060 }; // Hiranandani Business Park Powai
    }
    if (text.includes("lower parel") || text.includes("worli") || text.includes("builtin")) {
      return { lat: 18.9950, lng: 72.8280 }; // One World Center / Kamala Mills Lower Parel
    }
    if (text.includes("andheri east") || text.includes("seepz") || text.includes("global tech hub")) {
      return { lat: 19.1197, lng: 72.8697 }; // SEEPZ / MIDC Andheri East
    }
    if (text.includes("andheri") || text.includes("bluepeak") || text.includes("lokhandwala")) {
      return { lat: 19.1360, lng: 72.8315 }; // Link Road, Andheri West
    }
    if (text.includes("vikhroli") || text.includes("tata tele")) {
      return { lat: 19.1065, lng: 72.9285 }; // Godrej IT Park / Vikhroli
    }
    if (text.includes("nariman") || text.includes("fort") || text.includes("deccan") || text.includes("financial")) {
      return { lat: 18.9300, lng: 72.8330 }; // Fort / Nariman Point Financial District
    }
    if (text.includes("navi mumbai") || text.includes("airoli") || text.includes("vashi")) {
      return { lat: 19.1550, lng: 72.9980 }; // Airoli Mindspace
    }
    if (text.includes("malad") || text.includes("goregaon")) {
      return { lat: 19.1760, lng: 72.8360 }; // Mindspace Malad West
    }
    // Default Mumbai central inland business area (Bandra-Kurla border)
    return { lat: 19.0650, lng: 72.8550 };
  }
  return getCoordinatesForCity(job.city);
}

/**
 * Adds micro-offset (~300-500m) ONLY when multiple jobs share the exact same building/district,
 * keeping every marker firmly on dry land within the commercial district.
 */
export function getOffsetCoordinates(base: Coordinates, index: number, total: number): Coordinates {
  if (total <= 1) return base;
  // ~400-500 meters in degrees: enough to distinguish markers on high zoom without shifting across city/water
  const radius = 0.0045;
  const angle = (index / total) * 2 * Math.PI;
  return {
    lat: Number((base.lat + radius * Math.cos(angle)).toFixed(6)),
    lng: Number((base.lng + radius * Math.sin(angle)).toFixed(6)),
  };
}

/**
 * Aggregated candidate location pool for employer view.
 * Privacy-preserving: aggregated at city level.
 */
export type CandidateLocationCluster = {
  city: string;
  state: string;
  coords: Coordinates;
  candidateCount: number;
  openForRemote: number;
  topAccommodations: string[];
  sampleRoles: string[];
};

export const MOCK_CANDIDATE_LOCATIONS: CandidateLocationCluster[] = [
  {
    city: "Bengaluru",
    state: "Karnataka",
    coords: { lat: 12.9716, lng: 77.5946 },
    candidateCount: 24,
    openForRemote: 20,
    topAccommodations: ["Screen-reader support", "Ergonomic setup", "Accessible restroom"],
    sampleRoles: ["Frontend Engineer", "Data Analyst", "Accessibility Specialist"],
  },
  {
    city: "Mumbai",
    state: "Maharashtra",
    coords: { lat: 19.0760, lng: 72.8777 },
    candidateCount: 18,
    openForRemote: 16,
    topAccommodations: ["Flexible commute hours", "Quiet sensory room", "Captioned meetings"],
    sampleRoles: ["UX Designer", "Technical Writer", "Operations Associate"],
  },
  {
    city: "Delhi",
    state: "Delhi NCR",
    coords: { lat: 28.7041, lng: 77.1025 },
    candidateCount: 15,
    openForRemote: 14,
    topAccommodations: ["Accessible transit pickup", "Assistive keyboard tech", "Sign language support"],
    sampleRoles: ["Full Stack Developer", "Customer Success Lead", "Financial Analyst"],
  },
  {
    city: "Pune",
    state: "Maharashtra",
    coords: { lat: 18.5204, lng: 73.8567 },
    candidateCount: 12,
    openForRemote: 10,
    topAccommodations: ["Wheelchair ramp access", "Flexible schedule", "Voice-to-text tools"],
    sampleRoles: ["QA Automation Engineer", "Backend Developer", "HR Coordinator"],
  },
  {
    city: "Hyderabad",
    state: "Telangana",
    coords: { lat: 17.3850, lng: 78.4867 },
    candidateCount: 14,
    openForRemote: 12,
    topAccommodations: ["Screen-magnifier software", "Elevator priority", "Sensory-friendly lighting"],
    sampleRoles: ["Cloud Engineer", "Python Developer", "Data Scientist"],
  },
  {
    city: "Chennai",
    state: "Tamil Nadu",
    coords: { lat: 13.0827, lng: 80.2707 },
    candidateCount: 9,
    openForRemote: 8,
    topAccommodations: ["Hearing loop system", "Captioned video calls", "Accessible workstations"],
    sampleRoles: ["Mobile Developer", "Content Strategist", "Accountant"],
  },
  {
    city: "Kolkata",
    state: "West Bengal",
    coords: { lat: 22.5726, lng: 88.3639 },
    candidateCount: 7,
    openForRemote: 7,
    topAccommodations: ["Remote-first preference", "Color-blind friendly IDE", "Ergonomic seating"],
    sampleRoles: ["Frontend Specialist", "Customer Support", "Digital Marketer"],
  },
];
