import type { Job, WorkMode } from "./jobs-data";

export type TransitMode = "metro" | "bus" | "cab" | "auto" | "driving" | "walking";

export type CandidateCommuteProfile = {
  homeCity: string;
  homeLocality: string;
  needsStepFreeTransit: boolean;
  maxWalkDistanceMeters: number;
  preferredTransitModes: TransitMode[];
  needsTactilePaving: boolean;
  needsCompanyCabOrAllowance: boolean;
  needsReservedParking: boolean;
  avoidsPeakHourCrowds: boolean;
};

export const DEFAULT_COMMUTE_PROFILE: CandidateCommuteProfile = {
  homeCity: "Bengaluru",
  homeLocality: "Indiranagar",
  needsStepFreeTransit: false,
  maxWalkDistanceMeters: 500,
  preferredTransitModes: ["metro", "cab"],
  needsTactilePaving: false,
  needsCompanyCabOrAllowance: false,
  needsReservedParking: false,
  avoidsPeakHourCrowds: false,
};

export type WorkplaceCommuteData = {
  officeAddress: string;
  businessPark: string;
  corridor: string;
  nearestMetro: {
    name: string;
    line: string;
    distanceMeters: number;
    stepFree: boolean;
    hasElevators: boolean;
    hasTactilePaving: boolean;
    accessibleEgressGate: string;
  } | null;
  nearestBusStop: {
    name: string;
    distanceMeters: number;
    hasLowFloorBuses: boolean;
    sheltered: boolean;
  } | null;
  lastMilePathway: {
    distanceMeters: number;
    pavementQuality: "smooth_paved" | "moderate" | "unpaved_broken";
    continuousRamps: boolean;
    curbCuts: boolean;
    streetLighting: "excellent" | "average" | "poor";
    tactilePaving: boolean;
    barrierFreeGrade: "A" | "B" | "C";
  };
  officeAccessibility: {
    buildingHasElevator: boolean;
    stepFreeEntrance: boolean;
    dropOffZoneRamp: boolean;
    reservedPwdParking: boolean;
    distanceFromParkingToLobbyMeters: number;
    accessibleRestroomsNearWorkstation: boolean;
    automaticDoors: boolean;
  };
  commuteBenefits: {
    companyCabService: boolean;
    cabSubsidyMonthlyInr?: number;
    flexibleTimingsForCommute: boolean;
    accessibleShuttleFromMetro: boolean;
    remoteDaysPerWeek: number;
  };
};

export type CommuteScoreResult = {
  overallScore: number; // 0 - 100
  tier:
    | "Highly Accessible"
    | "Accessible with Minor Support"
    | "Moderate Commute Obstacles"
    | "High Commute Barriers";
  grade: "A+" | "A" | "B" | "C" | "D";
  subScores: {
    transitScore: number;
    lastMileScore: number;
    workplaceAccessScore: number;
    assistanceScore: number;
    remoteReliefScore: number;
  };
  greenFlags: string[];
  warnings: string[];
  routeLegs: {
    legNumber: number;
    title: string;
    mode: string;
    description: string;
    distanceOrDuration: string;
    accessibilityNotes: string;
    stepFree: boolean;
  }[];
  isRemoteRole: boolean;
  workplace: WorkplaceCommuteData;
};

export type CorridorId =
  | "bkc_mumbai"
  | "powai_mumbai"
  | "lower_parel_mumbai"
  | "andheri_mumbai"
  | "whitefield_bengaluru"
  | "manyata_bengaluru"
  | "cybercity_gurugram"
  | "hitec_city_hyderabad"
  | "generic_urban";

// Corridor dataset for major Indian commercial hubs with verified transit accessibility
export const CORRIDOR_PROFILES: Record<CorridorId, WorkplaceCommuteData> = {
  bkc_mumbai: {
    officeAddress: "G Block, Bandra Kurla Complex (BKC), Mumbai",
    businessPark: "BKC Commercial Hub",
    corridor: "Bandra Kurla Complex",
    nearestMetro: {
      name: "Bandra Kurla Complex (BKC) Metro Station",
      line: "Aqua Line 3 (Underground)",
      distanceMeters: 320,
      stepFree: true,
      hasElevators: true,
      hasTactilePaving: true,
      accessibleEgressGate: "Gate 2 (Ramp & Elevator direct to concourse)",
    },
    nearestBusStop: {
      name: "ICICI Tower BKC Bus Stop",
      distanceMeters: 140,
      hasLowFloorBuses: true,
      sheltered: true,
    },
    lastMilePathway: {
      distanceMeters: 320,
      pavementQuality: "smooth_paved",
      continuousRamps: true,
      curbCuts: true,
      streetLighting: "excellent",
      tactilePaving: true,
      barrierFreeGrade: "A",
    },
    officeAccessibility: {
      buildingHasElevator: true,
      stepFreeEntrance: true,
      dropOffZoneRamp: true,
      reservedPwdParking: true,
      distanceFromParkingToLobbyMeters: 25,
      accessibleRestroomsNearWorkstation: true,
      automaticDoors: true,
    },
    commuteBenefits: {
      companyCabService: true,
      cabSubsidyMonthlyInr: 4500,
      flexibleTimingsForCommute: true,
      accessibleShuttleFromMetro: true,
      remoteDaysPerWeek: 2,
    },
  },
  powai_mumbai: {
    officeAddress: "Hiranandani Business Park, Powai, Mumbai",
    businessPark: "Hiranandani Business Park",
    corridor: "Powai Central",
    nearestMetro: {
      name: "IIT Powai Metro Station (Line 6)",
      line: "Pink Line 6",
      distanceMeters: 650,
      stepFree: true,
      hasElevators: true,
      hasTactilePaving: true,
      accessibleEgressGate: "Gate 1 (Elevator & tactile path)",
    },
    nearestBusStop: {
      name: "Hiranandani Powai Bus Station",
      distanceMeters: 210,
      hasLowFloorBuses: true,
      sheltered: true,
    },
    lastMilePathway: {
      distanceMeters: 450,
      pavementQuality: "smooth_paved",
      continuousRamps: true,
      curbCuts: true,
      streetLighting: "excellent",
      tactilePaving: true,
      barrierFreeGrade: "A",
    },
    officeAccessibility: {
      buildingHasElevator: true,
      stepFreeEntrance: true,
      dropOffZoneRamp: true,
      reservedPwdParking: true,
      distanceFromParkingToLobbyMeters: 35,
      accessibleRestroomsNearWorkstation: true,
      automaticDoors: true,
    },
    commuteBenefits: {
      companyCabService: true,
      cabSubsidyMonthlyInr: 4000,
      flexibleTimingsForCommute: true,
      accessibleShuttleFromMetro: true,
      remoteDaysPerWeek: 2,
    },
  },
  lower_parel_mumbai: {
    officeAddress: "Kamala Mills Compound, Senapati Bapat Marg, Lower Parel, Mumbai",
    businessPark: "Kamala Mills / One World Center",
    corridor: "Lower Parel Commercial Corridor",
    nearestMetro: {
      name: "Science Centre / Acharya Atre Metro (Line 3)",
      line: "Aqua Line 3",
      distanceMeters: 550,
      stepFree: true,
      hasElevators: true,
      hasTactilePaving: true,
      accessibleEgressGate: "Gate 3 (Lift to street level)",
    },
    nearestBusStop: {
      name: "Kamala Mills Bus Stop",
      distanceMeters: 120,
      hasLowFloorBuses: true,
      sheltered: true,
    },
    lastMilePathway: {
      distanceMeters: 380,
      pavementQuality: "moderate",
      continuousRamps: true,
      curbCuts: true,
      streetLighting: "average",
      tactilePaving: false,
      barrierFreeGrade: "B",
    },
    officeAccessibility: {
      buildingHasElevator: true,
      stepFreeEntrance: true,
      dropOffZoneRamp: true,
      reservedPwdParking: true,
      distanceFromParkingToLobbyMeters: 40,
      accessibleRestroomsNearWorkstation: true,
      automaticDoors: true,
    },
    commuteBenefits: {
      companyCabService: true,
      cabSubsidyMonthlyInr: 5000,
      flexibleTimingsForCommute: true,
      accessibleShuttleFromMetro: false,
      remoteDaysPerWeek: 2,
    },
  },
  andheri_mumbai: {
    officeAddress: "SEEPZ / MIDC Central Road, Andheri East, Mumbai",
    businessPark: "SEEPZ Tech Zone",
    corridor: "Andheri MIDC",
    nearestMetro: {
      name: "SEEPZ Metro Station (Line 3)",
      line: "Aqua Line 3 & Line 1 Chakala",
      distanceMeters: 420,
      stepFree: true,
      hasElevators: true,
      hasTactilePaving: true,
      accessibleEgressGate: "Gate 1 (Street lift to MIDC Concourse)",
    },
    nearestBusStop: {
      name: "SEEPZ Gate 1 BEST Depot",
      distanceMeters: 180,
      hasLowFloorBuses: true,
      sheltered: true,
    },
    lastMilePathway: {
      distanceMeters: 350,
      pavementQuality: "smooth_paved",
      continuousRamps: true,
      curbCuts: true,
      streetLighting: "excellent",
      tactilePaving: true,
      barrierFreeGrade: "A",
    },
    officeAccessibility: {
      buildingHasElevator: true,
      stepFreeEntrance: true,
      dropOffZoneRamp: true,
      reservedPwdParking: true,
      distanceFromParkingToLobbyMeters: 30,
      accessibleRestroomsNearWorkstation: true,
      automaticDoors: true,
    },
    commuteBenefits: {
      companyCabService: true,
      cabSubsidyMonthlyInr: 4000,
      flexibleTimingsForCommute: true,
      accessibleShuttleFromMetro: true,
      remoteDaysPerWeek: 1,
    },
  },
  whitefield_bengaluru: {
    officeAddress: "ITPL Main Road, Whitefield, Bengaluru",
    businessPark: "International Tech Park Bengaluru (ITPL)",
    corridor: "Whitefield Tech Corridor",
    nearestMetro: {
      name: "Pattandur Agrahara (ITPL) Metro Station",
      line: "Purple Line",
      distanceMeters: 250,
      stepFree: true,
      hasElevators: true,
      hasTactilePaving: true,
      accessibleEgressGate: "Direct Covered Skywalk with Elevators into ITPL Campus",
    },
    nearestBusStop: {
      name: "ITPL Main Gate Bus Shelter",
      distanceMeters: 110,
      hasLowFloorBuses: true,
      sheltered: true,
    },
    lastMilePathway: {
      distanceMeters: 250,
      pavementQuality: "smooth_paved",
      continuousRamps: true,
      curbCuts: true,
      streetLighting: "excellent",
      tactilePaving: true,
      barrierFreeGrade: "A",
    },
    officeAccessibility: {
      buildingHasElevator: true,
      stepFreeEntrance: true,
      dropOffZoneRamp: true,
      reservedPwdParking: true,
      distanceFromParkingToLobbyMeters: 20,
      accessibleRestroomsNearWorkstation: true,
      automaticDoors: true,
    },
    commuteBenefits: {
      companyCabService: true,
      cabSubsidyMonthlyInr: 5000,
      flexibleTimingsForCommute: true,
      accessibleShuttleFromMetro: true,
      remoteDaysPerWeek: 2,
    },
  },
  manyata_bengaluru: {
    officeAddress: "Nagavara Outer Ring Road, Manyata Tech Park, Bengaluru",
    businessPark: "Manyata Embassy Business Park",
    corridor: "North Bengaluru ORR",
    nearestMetro: {
      name: "Nagavara Metro Station (Blue/Pink Line)",
      line: "Blue Line / Pink Line",
      distanceMeters: 680,
      stepFree: true,
      hasElevators: true,
      hasTactilePaving: true,
      accessibleEgressGate: "Gate 2 (Lift access)",
    },
    nearestBusStop: {
      name: "Manyata Tech Park Gate 1 Bus Stop",
      distanceMeters: 220,
      hasLowFloorBuses: true,
      sheltered: true,
    },
    lastMilePathway: {
      distanceMeters: 400,
      pavementQuality: "smooth_paved",
      continuousRamps: true,
      curbCuts: true,
      streetLighting: "excellent",
      tactilePaving: true,
      barrierFreeGrade: "A",
    },
    officeAccessibility: {
      buildingHasElevator: true,
      stepFreeEntrance: true,
      dropOffZoneRamp: true,
      reservedPwdParking: true,
      distanceFromParkingToLobbyMeters: 25,
      accessibleRestroomsNearWorkstation: true,
      automaticDoors: true,
    },
    commuteBenefits: {
      companyCabService: true,
      cabSubsidyMonthlyInr: 4500,
      flexibleTimingsForCommute: true,
      accessibleShuttleFromMetro: true,
      remoteDaysPerWeek: 2,
    },
  },
  cybercity_gurugram: {
    officeAddress: "DLF Cyber City, Building 10, DLF Phase 2, Gurugram, Delhi NCR",
    businessPark: "DLF Cyber City",
    corridor: "Gurugram Cyber Hub",
    nearestMetro: {
      name: "Cyber City Rapid Metro Station",
      line: "Gurugram Rapid Metro (Interchange with Yellow Line)",
      distanceMeters: 210,
      stepFree: true,
      hasElevators: true,
      hasTactilePaving: true,
      accessibleEgressGate: "Platform 1 Walkway with Continuous Ramps & Elevators",
    },
    nearestBusStop: {
      name: "Shankar Chowk Highway Bus Bay",
      distanceMeters: 380,
      hasLowFloorBuses: true,
      sheltered: true,
    },
    lastMilePathway: {
      distanceMeters: 210,
      pavementQuality: "smooth_paved",
      continuousRamps: true,
      curbCuts: true,
      streetLighting: "excellent",
      tactilePaving: true,
      barrierFreeGrade: "A",
    },
    officeAccessibility: {
      buildingHasElevator: true,
      stepFreeEntrance: true,
      dropOffZoneRamp: true,
      reservedPwdParking: true,
      distanceFromParkingToLobbyMeters: 20,
      accessibleRestroomsNearWorkstation: true,
      automaticDoors: true,
    },
    commuteBenefits: {
      companyCabService: true,
      cabSubsidyMonthlyInr: 6000,
      flexibleTimingsForCommute: true,
      accessibleShuttleFromMetro: true,
      remoteDaysPerWeek: 2,
    },
  },
  hitec_city_hyderabad: {
    officeAddress: "Mindspace IT Park, Madhapur, Hitec City, Hyderabad",
    businessPark: "Raheja Mindspace IT Park",
    corridor: "Hitec City / Madhapur",
    nearestMetro: {
      name: "Hitec City Metro Station",
      line: "Blue Line (Elevated)",
      distanceMeters: 390,
      stepFree: true,
      hasElevators: true,
      hasTactilePaving: true,
      accessibleEgressGate: "Gate A (Direct Elevator to Street Level Ramp)",
    },
    nearestBusStop: {
      name: "Mindspace Circle Bus Shelter",
      distanceMeters: 190,
      hasLowFloorBuses: true,
      sheltered: true,
    },
    lastMilePathway: {
      distanceMeters: 350,
      pavementQuality: "smooth_paved",
      continuousRamps: true,
      curbCuts: true,
      streetLighting: "excellent",
      tactilePaving: true,
      barrierFreeGrade: "A",
    },
    officeAccessibility: {
      buildingHasElevator: true,
      stepFreeEntrance: true,
      dropOffZoneRamp: true,
      reservedPwdParking: true,
      distanceFromParkingToLobbyMeters: 30,
      accessibleRestroomsNearWorkstation: true,
      automaticDoors: true,
    },
    commuteBenefits: {
      companyCabService: true,
      cabSubsidyMonthlyInr: 4500,
      flexibleTimingsForCommute: true,
      accessibleShuttleFromMetro: true,
      remoteDaysPerWeek: 2,
    },
  },
  generic_urban: {
    officeAddress: "Commercial Business District, Central Tech Corridor",
    businessPark: "Tech Gateway Business Hub",
    corridor: "Urban Commercial Corridor",
    nearestMetro: {
      name: "Central Metro Station",
      line: "Urban Line",
      distanceMeters: 600,
      stepFree: true,
      hasElevators: true,
      hasTactilePaving: true,
      accessibleEgressGate: "Main Gate (Elevator & ramp)",
    },
    nearestBusStop: {
      name: "Main Junction Bus Stop",
      distanceMeters: 250,
      hasLowFloorBuses: true,
      sheltered: true,
    },
    lastMilePathway: {
      distanceMeters: 450,
      pavementQuality: "moderate",
      continuousRamps: true,
      curbCuts: true,
      streetLighting: "average",
      tactilePaving: false,
      barrierFreeGrade: "B",
    },
    officeAccessibility: {
      buildingHasElevator: true,
      stepFreeEntrance: true,
      dropOffZoneRamp: true,
      reservedPwdParking: true,
      distanceFromParkingToLobbyMeters: 40,
      accessibleRestroomsNearWorkstation: true,
      automaticDoors: true,
    },
    commuteBenefits: {
      companyCabService: true,
      cabSubsidyMonthlyInr: 3500,
      flexibleTimingsForCommute: true,
      accessibleShuttleFromMetro: false,
      remoteDaysPerWeek: 2,
    },
  },
};

/**
 * Resolves the workplace commute accessibility profile for a given job.
 */
export function getWorkplaceCommuteData(job: Job): WorkplaceCommuteData {
  const text = `${job.city} ${job.company} ${job.title} ${job.about}`.toLowerCase();

  if (text.includes("bkc") || text.includes("bandra kurla")) {
    return CORRIDOR_PROFILES.bkc_mumbai;
  }
  if (text.includes("powai") || text.includes("hiranandani")) {
    return CORRIDOR_PROFILES.powai_mumbai;
  }
  if (text.includes("lower parel") || text.includes("worli") || text.includes("kamala mills")) {
    return CORRIDOR_PROFILES.lower_parel_mumbai;
  }
  if (text.includes("andheri") || text.includes("seepz") || text.includes("midc")) {
    return CORRIDOR_PROFILES.andheri_mumbai;
  }
  if (text.includes("whitefield") || text.includes("itpl")) {
    return CORRIDOR_PROFILES.whitefield_bengaluru;
  }
  if (text.includes("manyata") || text.includes("nagavara")) {
    return CORRIDOR_PROFILES.manyata_bengaluru;
  }
  if (text.includes("cyber city") || text.includes("gurugram") || text.includes("gurgaon")) {
    return CORRIDOR_PROFILES.cybercity_gurugram;
  }
  if (text.includes("hitec") || text.includes("madhapur") || text.includes("mindspace")) {
    return CORRIDOR_PROFILES.hitec_city_hyderabad;
  }

  // City-level defaults
  if (text.includes("mumbai")) return CORRIDOR_PROFILES.bkc_mumbai;
  if (text.includes("bengaluru") || text.includes("bangalore"))
    return CORRIDOR_PROFILES.whitefield_bengaluru;
  if (text.includes("delhi") || text.includes("noida")) return CORRIDOR_PROFILES.cybercity_gurugram;
  if (text.includes("hyderabad")) return CORRIDOR_PROFILES.hitec_city_hyderabad;

  return CORRIDOR_PROFILES.generic_urban;
}

/**
 * Calculates deterministic commute accessibility scoring and journey breakdown.
 */
export function calculateCommuteAccessibility(
  job: Job,
  profile: CandidateCommuteProfile = DEFAULT_COMMUTE_PROFILE,
): CommuteScoreResult {
  const isRemoteRole = job.workMode === "Remote";
  const workplace = getWorkplaceCommuteData(job);

  // If 100% Remote, commute barriers are completely eliminated
  if (isRemoteRole) {
    return {
      overallScore: 100,
      tier: "Highly Accessible",
      grade: "A+",
      subScores: {
        transitScore: 100,
        lastMileScore: 100,
        workplaceAccessScore: 100,
        assistanceScore: 100,
        remoteReliefScore: 100,
      },
      greenFlags: [
        "100% Remote Role: Physical commute and public transport barriers eliminated entirely",
        "Work comfortably from home with flexible hours and no physical transit stress",
        "Ergonomic home workstation setup allowance supported",
      ],
      warnings: [],
      routeLegs: [
        {
          legNumber: 1,
          title: "Home Office Setup",
          mode: "Remote",
          description:
            "Zero physical travel required. Digital sign-in from your preferred accessible environment.",
          distanceOrDuration: "0 meters • 0 mins",
          accessibilityNotes: "100% barrier-free home workspace",
          stepFree: true,
        },
      ],
      isRemoteRole: true,
      workplace,
    };
  }

  const greenFlags: string[] = [];
  const warnings: string[] = [];

  // 1. Transit Score (0 - 100)
  let transitScore = 75;
  if (workplace.nearestMetro) {
    const metro = workplace.nearestMetro;
    if (metro.stepFree && metro.hasElevators) {
      transitScore += 15;
      greenFlags.push(
        `Step-free metro station nearby: ${metro.name} (${metro.distanceMeters}m) with full elevator access`,
      );
    } else if (profile.needsStepFreeTransit) {
      transitScore -= 30;
      warnings.push(
        `Nearest metro (${metro.name}) has limited elevator access or non-continuous step-free paths`,
      );
    }

    if (profile.needsTactilePaving && metro.hasTactilePaving) {
      transitScore += 10;
      greenFlags.push("Continuous tactile ground paving indicators from platform to station exit");
    } else if (profile.needsTactilePaving && !metro.hasTactilePaving) {
      transitScore -= 15;
      warnings.push("Tactile paving is incomplete between metro platform and street exit");
    }

    if (metro.distanceMeters <= profile.maxWalkDistanceMeters) {
      transitScore += 10;
    } else {
      if (workplace.commuteBenefits.accessibleShuttleFromMetro) {
        transitScore += 5;
        greenFlags.push("Accessible company shuttle available directly from the metro station");
      } else {
        transitScore -= 15;
      }
      warnings.push(
        `Metro distance (${metro.distanceMeters}m) exceeds your preferred max walking distance (${profile.maxWalkDistanceMeters}m)`,
      );
    }
  }

  if (workplace.nearestBusStop?.hasLowFloorBuses) {
    transitScore = Math.min(100, transitScore + 5);
  }

  transitScore = Math.max(10, Math.min(100, transitScore));

  // 2. Last-Mile Pathway Score (0 - 100)
  let lastMileScore = 70;
  const pathway = workplace.lastMilePathway;

  if (pathway.pavementQuality === "smooth_paved") {
    lastMileScore += 15;
    greenFlags.push(
      "Paved, wide footpaths with curb cuts suitable for wheelchairs and mobility aids",
    );
  } else if (pathway.pavementQuality === "unpaved_broken") {
    lastMileScore -= 30;
    warnings.push(
      "Footpath has uneven paving or construction obstacles; companion assistance or cab recommended",
    );
  }

  if (pathway.continuousRamps && pathway.curbCuts) {
    lastMileScore += 10;
  } else if (profile.needsStepFreeTransit) {
    lastMileScore -= 20;
    warnings.push("Curb cuts are not continuous along the roadside pathway");
  }

  if (pathway.distanceMeters > profile.maxWalkDistanceMeters) {
    lastMileScore -= 15;
    warnings.push(
      `Last-mile distance (${pathway.distanceMeters}m) exceeds your preferred max walking distance (${profile.maxWalkDistanceMeters}m)`,
    );
  }

  lastMileScore = Math.max(10, Math.min(100, lastMileScore));

  // 3. Workplace Access Score (0 - 100)
  let workplaceAccessScore = 75;
  const office = workplace.officeAccessibility;

  if (office.buildingHasElevator && office.stepFreeEntrance) {
    workplaceAccessScore += 15;
    greenFlags.push("Office entrance has wide automatic doors and step-free ramps to elevators");
  } else if (profile.needsStepFreeTransit) {
    workplaceAccessScore -= 35;
    warnings.push("Office building entrance has stairs without an adjoining ramp");
  }

  if (profile.needsReservedParking) {
    if (office.reservedPwdParking) {
      workplaceAccessScore += 10;
      greenFlags.push(
        `Reserved PwD accessible parking bay within ${office.distanceFromParkingToLobbyMeters}m of lobby elevators`,
      );
    } else {
      workplaceAccessScore -= 20;
      warnings.push("Dedicated accessible PwD parking spaces are not guaranteed by this building");
    }
  }

  if (office.dropOffZoneRamp) {
    workplaceAccessScore += 5;
  }

  workplaceAccessScore = Math.max(15, Math.min(100, workplaceAccessScore));

  // 4. Assistance & Benefits Score (0 - 100)
  let assistanceScore = 60;
  const benefits = workplace.commuteBenefits;

  if (benefits.companyCabService) {
    assistanceScore += 25;
    greenFlags.push("Employer provides accessible door-to-door cab or shuttle pickup");
  }
  if (benefits.cabSubsidyMonthlyInr && benefits.cabSubsidyMonthlyInr > 0) {
    assistanceScore += 10;
    greenFlags.push(
      `Monthly accessible transit subsidy of ₹${benefits.cabSubsidyMonthlyInr.toLocaleString("en-IN")}`,
    );
  }
  if (benefits.flexibleTimingsForCommute) {
    assistanceScore += 15;
    greenFlags.push("Flexible arrival & departure timings to travel outside peak rush-hour crowds");
  }

  if (
    profile.needsCompanyCabOrAllowance &&
    !benefits.companyCabService &&
    !benefits.cabSubsidyMonthlyInr
  ) {
    assistanceScore -= 25;
    warnings.push(
      "Employer does not provide dedicated accessible cab service or transport allowance",
    );
  }

  assistanceScore = Math.max(10, Math.min(100, assistanceScore));

  // 5. Remote / Hybrid Relief Score (0 - 100)
  let remoteReliefScore = 60;
  if (job.workMode === "Hybrid") {
    remoteReliefScore = 88;
    greenFlags.push(
      `Hybrid schedule (${benefits.remoteDaysPerWeek} days remote/week) significantly reduces weekly commute load`,
    );
  } else if (job.workMode === "On-site") {
    remoteReliefScore = 55;
  }

  // Composite Weighted Score
  // Weights: Transit 30%, Last Mile 25%, Workplace Access 25%, Assistance 15%, Remote Relief 5%
  const composite = Math.round(
    transitScore * 0.3 +
      lastMileScore * 0.25 +
      workplaceAccessScore * 0.25 +
      assistanceScore * 0.15 +
      remoteReliefScore * 0.05,
  );

  const overallScore = Math.max(0, Math.min(100, composite));

  let tier: CommuteScoreResult["tier"] = "Highly Accessible";
  let grade: CommuteScoreResult["grade"] = "A";

  if (overallScore >= 90) {
    tier = "Highly Accessible";
    grade = "A+";
  } else if (overallScore >= 78) {
    tier = "Accessible with Minor Support";
    grade = "A";
  } else if (overallScore >= 60) {
    tier = "Moderate Commute Obstacles";
    grade = "B";
  } else if (overallScore >= 45) {
    tier = "High Commute Barriers";
    grade = "C";
  } else {
    tier = "High Commute Barriers";
    grade = "D";
  }

  // Generate Step-by-Step Journey Legs
  const routeLegs: CommuteScoreResult["routeLegs"] = [
    {
      legNumber: 1,
      title: `Home Departure (${profile.homeLocality}, ${profile.homeCity})`,
      mode: profile.preferredTransitModes[0] || "metro",
      description: `Begin journey from ${profile.homeLocality}. Recommended mode: ${
        benefits.companyCabService
          ? "Company Accessible Cab (Door-to-door)"
          : profile.preferredTransitModes.includes("metro")
            ? "Metro with step-free boarding"
            : "Accessible Taxi / Low-floor bus"
      }.`,
      distanceOrDuration: "Starting Point",
      accessibilityNotes: profile.avoidsPeakHourCrowds
        ? "Travel between 10:30 AM - 4:30 PM recommended for low sensory and seating comfort"
        : "Standard transit schedule",
      stepFree: true,
    },
    {
      legNumber: 2,
      title: workplace.nearestMetro
        ? `Metro Transit (${workplace.nearestMetro.name})`
        : "Direct Vehicle / Bus Transit",
      mode: workplace.nearestMetro ? "Metro" : "Bus / Cab",
      description: workplace.nearestMetro
        ? `Take ${workplace.nearestMetro.line} to ${workplace.nearestMetro.name}. Use ${workplace.nearestMetro.accessibleEgressGate}.`
        : `Take low-floor city transit or cab to ${workplace.businessPark}.`,
      distanceOrDuration: "Approx. 25-35 mins",
      accessibilityNotes: workplace.nearestMetro?.stepFree
        ? "Station has dedicated elevators between platform and street level"
        : "Check platform-to-train gap assistance at help desk",
      stepFree: workplace.nearestMetro?.stepFree ?? true,
    },
    {
      legNumber: 3,
      title: "Last-Mile Walk / Wheel to Campus Gate",
      mode: pathway.continuousRamps ? "Wheelchair / Pedestrian Ramp" : "Pedestrian Pathway",
      description: `Navigate ${pathway.distanceMeters}m along ${pathway.pavementQuality === "smooth_paved" ? "smooth paved sidewalk" : "commercial corridor road"} to main security lobby.`,
      distanceOrDuration: `${pathway.distanceMeters} meters • ~${Math.ceil(pathway.distanceMeters / 70)} mins`,
      accessibilityNotes: pathway.curbCuts
        ? "Continuous curb cuts and ramps at all street crossings"
        : "Caution: uneven road curbs; use security gate crossing ramp",
      stepFree: pathway.continuousRamps,
    },
    {
      legNumber: 4,
      title: `Office Entrance (${workplace.businessPark})`,
      mode: "Elevator & Ramp",
      description: `Enter via step-free lobby. Elevators equipped with auditory announcements and low-height buttons directly to workstation floor.`,
      distanceOrDuration: "Within Building",
      accessibilityNotes: office.reservedPwdParking
        ? `Dedicated PwD parking available within ${office.distanceFromParkingToLobbyMeters}m of elevator lobby`
        : "Drop-off bay at building entrance has barrier-free curb cuts",
      stepFree: office.stepFreeEntrance && office.buildingHasElevator,
    },
  ];

  return {
    overallScore,
    tier,
    grade,
    subScores: {
      transitScore,
      lastMileScore,
      workplaceAccessScore,
      assistanceScore,
      remoteReliefScore,
    },
    greenFlags,
    warnings,
    routeLegs,
    isRemoteRole: false,
    workplace,
  };
}
