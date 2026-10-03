import { describe, it, expect } from "vitest";
import type { Landmark, TimestampedLandmark, HandGesture } from "@/lib/gestures/types";
import {
  classifyStaticPose,
  classifySwipeGesture,
  classifyGesture,
  distance2D,
  getPalmCenter,
} from "@/lib/gestures/classifier";
import { GestureHoldTracker } from "@/lib/gestures/hold-detector";
import { DEFAULT_GESTURE_MAPPING, SENSITIVITY_SETTINGS } from "@/lib/gestures/types";

// ============================================================================
// Synthetic Landmark Fixtures Generator
// ============================================================================

function makeNeutralLandmarks(): Landmark[] {
  // 21 points initialized to neutral wrist position
  const pts: Landmark[] = [];
  for (let i = 0; i < 21; i++) {
    pts.push({ x: 0.5, y: 0.7, z: 0 });
  }
  return pts;
}

/**
 * Creates Open Palm fixture where all 5 fingers are fully extended.
 */
function createOpenPalmLandmarks(): Landmark[] {
  const pts = makeNeutralLandmarks();
  // Wrist
  pts[0] = { x: 0.5, y: 0.8, z: 0 };

  // Thumb: extends outwards to the left
  pts[1] = { x: 0.45, y: 0.75, z: 0 };
  pts[2] = { x: 0.4, y: 0.7, z: 0 };
  pts[3] = { x: 0.35, y: 0.65, z: 0 };
  pts[4] = { x: 0.28, y: 0.6, z: 0 }; // Thumb tip extended

  // Index finger extended upwards
  pts[5] = { x: 0.45, y: 0.6, z: 0 };
  pts[6] = { x: 0.45, y: 0.5, z: 0 };
  pts[7] = { x: 0.45, y: 0.4, z: 0 };
  pts[8] = { x: 0.45, y: 0.25, z: 0 }; // Index tip

  // Middle finger extended upwards
  pts[9] = { x: 0.5, y: 0.58, z: 0 };
  pts[10] = { x: 0.5, y: 0.48, z: 0 };
  pts[11] = { x: 0.5, y: 0.38, z: 0 };
  pts[12] = { x: 0.5, y: 0.2, z: 0 }; // Middle tip

  // Ring finger extended upwards
  pts[13] = { x: 0.55, y: 0.6, z: 0 };
  pts[14] = { x: 0.55, y: 0.5, z: 0 };
  pts[15] = { x: 0.55, y: 0.4, z: 0 };
  pts[16] = { x: 0.55, y: 0.25, z: 0 }; // Ring tip

  // Pinky finger extended upwards
  pts[17] = { x: 0.6, y: 0.63, z: 0 };
  pts[18] = { x: 0.6, y: 0.55, z: 0 };
  pts[19] = { x: 0.6, y: 0.47, z: 0 };
  pts[20] = { x: 0.6, y: 0.32, z: 0 }; // Pinky tip

  return pts;
}

/**
 * Creates Closed Fist fixture where fingers are curled into palm.
 */
function createFistLandmarks(): Landmark[] {
  const pts = makeNeutralLandmarks();
  // Wrist
  pts[0] = { x: 0.5, y: 0.8, z: 0 };

  // Thumb folded across fingers
  pts[1] = { x: 0.47, y: 0.75, z: 0 };
  pts[2] = { x: 0.46, y: 0.7, z: 0 };
  pts[3] = { x: 0.48, y: 0.68, z: 0 };
  pts[4] = { x: 0.51, y: 0.67, z: 0 }; // Thumb folded

  // Index curled in
  pts[5] = { x: 0.45, y: 0.62, z: 0 }; // MCP
  pts[6] = { x: 0.45, y: 0.55, z: 0 }; // PIP
  pts[7] = { x: 0.45, y: 0.62, z: 0 }; // DIP curled back
  pts[8] = { x: 0.45, y: 0.68, z: 0 }; // TIP near MCP

  // Middle curled in
  pts[9] = { x: 0.5, y: 0.6, z: 0 };
  pts[10] = { x: 0.5, y: 0.53, z: 0 };
  pts[11] = { x: 0.5, y: 0.6, z: 0 };
  pts[12] = { x: 0.5, y: 0.67, z: 0 };

  // Ring curled in
  pts[13] = { x: 0.55, y: 0.62, z: 0 };
  pts[14] = { x: 0.55, y: 0.55, z: 0 };
  pts[15] = { x: 0.55, y: 0.62, z: 0 };
  pts[16] = { x: 0.55, y: 0.68, z: 0 };

  // Pinky curled in
  pts[17] = { x: 0.6, y: 0.64, z: 0 };
  pts[18] = { x: 0.6, y: 0.58, z: 0 };
  pts[19] = { x: 0.6, y: 0.63, z: 0 };
  pts[20] = { x: 0.6, y: 0.68, z: 0 };

  return pts;
}

/**
 * Creates Thumbs Up fixture: curled fingers + thumb pointing upward.
 */
function createThumbsUpLandmarks(): Landmark[] {
  const pts = createFistLandmarks();
  // Modify thumb to point straight up (lower y coordinate)
  pts[1] = { x: 0.45, y: 0.75, z: 0 }; // CMC
  pts[2] = { x: 0.43, y: 0.66, z: 0 }; // MCP
  pts[3] = { x: 0.42, y: 0.54, z: 0 }; // IP
  pts[4] = { x: 0.41, y: 0.4, z: 0 }; // TIP pointing high above wrist (0.8)
  return pts;
}

/**
 * Creates Pinch fixture: index tip and thumb tip touching, other fingers apart.
 */
function createPinchLandmarks(): Landmark[] {
  const pts = createOpenPalmLandmarks();
  // Bring index tip (8) and thumb tip (4) to the exact same position
  pts[4] = { x: 0.45, y: 0.4, z: 0 };
  pts[8] = { x: 0.46, y: 0.41, z: 0 }; // Distance ~ 0.014
  // Keep middle tip (12) further away
  pts[12] = { x: 0.55, y: 0.25, z: 0 };
  return pts;
}

/**
 * Creates a sequence of landmarks simulating horizontal or vertical swipe.
 */
function createSwipeHistory(
  direction: "left" | "right" | "up" | "down",
  now = 1000,
): { current: Landmark[]; history: TimestampedLandmark[] } {
  const base = createOpenPalmLandmarks();
  const startX = 0.5;
  const startY = 0.5;

  let endX = startX;
  let endY = startY;

  if (direction === "right") endX = startX + 0.3;
  if (direction === "left") endX = startX - 0.3;
  if (direction === "down") endY = startY + 0.3;
  if (direction === "up") endY = startY - 0.3;

  const oldestLandmarks = base.map((p) => ({
    x: p.x + (startX - 0.5),
    y: p.y + (startY - 0.5),
    z: p.z,
  }));

  const currentLandmarks = base.map((p) => ({
    x: p.x + (endX - 0.5),
    y: p.y + (endY - 0.5),
    z: p.z,
  }));

  const history: TimestampedLandmark[] = [
    { landmarks: oldestLandmarks, timestamp: now - 200 },
    { landmarks: currentLandmarks, timestamp: now },
  ];

  return { current: currentLandmarks, history };
}

// ============================================================================
// Vitest Test Suites
// ============================================================================

describe("Pure-Function Hand Gesture Classifier", () => {
  it("calculates 2D Euclidean distance correctly", () => {
    expect(distance2D({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 })).toBe(5);
    expect(distance2D({ x: 1, y: 1, z: 0 }, { x: 1, y: 1, z: 0 })).toBe(0);
  });

  it("calculates palm center as average of wrist and MCP joints", () => {
    const landmarks = createOpenPalmLandmarks();
    const center = getPalmCenter(landmarks);
    expect(center.x).toBeGreaterThan(0.4);
    expect(center.x).toBeLessThan(0.6);
    expect(center.y).toBeGreaterThan(0.6);
  });

  it("correctly identifies pinch gesture", () => {
    const pinch = createPinchLandmarks();
    const result = classifyStaticPose(pinch);
    expect(result).toBe("pinch");
  });

  it("correctly identifies open palm gesture", () => {
    const openPalm = createOpenPalmLandmarks();
    const result = classifyStaticPose(openPalm);
    expect(result).toBe("open_palm");
  });

  it("correctly identifies closed fist gesture", () => {
    const fist = createFistLandmarks();
    const result = classifyStaticPose(fist);
    expect(result).toBe("fist");
  });

  it("correctly identifies thumbs up gesture", () => {
    const thumbsUp = createThumbsUpLandmarks();
    const result = classifyStaticPose(thumbsUp);
    expect(result).toBe("thumbs_up");
  });

  it("returns null for invalid or incomplete landmark arrays", () => {
    expect(classifyStaticPose([])).toBeNull();
    expect(classifyStaticPose(new Array(10).fill({ x: 0, y: 0, z: 0 }))).toBeNull();
  });

  describe("Dynamic Swipe Gestures", () => {
    it("correctly classifies swipe right motion", () => {
      const { current, history } = createSwipeHistory("right");
      const result = classifySwipeGesture(current, history);
      expect(result).toBe("swipe_right");
    });

    it("correctly classifies swipe left motion", () => {
      const { current, history } = createSwipeHistory("left");
      const result = classifySwipeGesture(current, history);
      expect(result).toBe("swipe_left");
    });

    it("correctly classifies swipe up motion", () => {
      const { current, history } = createSwipeHistory("up");
      const result = classifySwipeGesture(current, history);
      expect(result).toBe("swipe_up");
    });

    it("correctly classifies swipe down motion", () => {
      const { current, history } = createSwipeHistory("down");
      const result = classifySwipeGesture(current, history);
      expect(result).toBe("swipe_down");
    });

    it("prioritizes dynamic swipe over static pose in unified classifyGesture", () => {
      const { current, history } = createSwipeHistory("right");
      const result = classifyGesture(current, history);
      expect(result).toBe("swipe_right");
    });
  });
});

describe("Hold-Time and Cooldown State Machine", () => {
  it("requires static gestures to be held ~500ms before triggering", () => {
    const tracker = new GestureHoldTracker(500, 700);

    // Initial frame at t=0
    let state = tracker.update("thumbs_up", 1000);
    expect(state.triggeredGesture).toBeNull();
    expect(state.activeGesture).toBe("thumbs_up");
    expect(state.progress).toBe(0);

    // After 250ms (halfway held)
    state = tracker.update("thumbs_up", 1250);
    expect(state.triggeredGesture).toBeNull();
    expect(state.progress).toBeCloseTo(0.5, 1);

    // After 490ms (almost held, still not triggered)
    state = tracker.update("thumbs_up", 1490);
    expect(state.triggeredGesture).toBeNull();

    // At 500ms (threshold met -> triggers!)
    state = tracker.update("thumbs_up", 1500);
    expect(state.triggeredGesture).toBe("thumbs_up");
    expect(state.progress).toBe(1);
  });

  it("does not repeatedly re-trigger without user releasing the hold", () => {
    const tracker = new GestureHoldTracker(500, 700);

    tracker.update("fist", 1000);
    tracker.update("fist", 1500); // Triggers at 1500

    // Continuing to hold fist at 1600ms should NOT trigger again
    const state = tracker.update("fist", 1600);
    expect(state.triggeredGesture).toBeNull();
  });

  it("enforces cooldown period to prevent accidental rapid re-triggers", () => {
    const tracker = new GestureHoldTracker(500, 700);

    // Trigger fist at 1500ms
    tracker.update("fist", 1000);
    tracker.update("fist", 1500);

    // User switches to pinch at 1600ms (only 100ms after last trigger, cooldown is 700ms)
    const state = tracker.update("pinch", 1600);
    expect(state.isCoolingDown).toBe(true);
    expect(state.triggeredGesture).toBeNull();

    // After cooldown expires (1500 + 700 = 2200ms)
    const afterCooldown = tracker.update("pinch", 2300);
    expect(afterCooldown.isCoolingDown).toBe(false);
  });

  it("triggers dynamic swipe gestures with cooldown enforcement", () => {
    const tracker = new GestureHoldTracker(500, 700);

    // Swipes trigger immediately upon detection
    const state1 = tracker.update("swipe_right", 1000);
    expect(state1.triggeredGesture).toBe("swipe_right");

    // Second swipe within cooldown does NOT trigger
    const state2 = tracker.update("swipe_right", 1300);
    expect(state2.triggeredGesture).toBeNull();
    expect(state2.isCoolingDown).toBe(true);

    // After cooldown expires
    const state3 = tracker.update("swipe_left", 1800);
    expect(state3.triggeredGesture).toBe("swipe_left");
  });

  it("resets hold progress if candidate gesture changes or is released", () => {
    const tracker = new GestureHoldTracker(500, 700);

    tracker.update("thumbs_up", 1000);
    tracker.update("thumbs_up", 1300); // 300ms held

    // Hand lost or changed
    const lost = tracker.update(null, 1350);
    expect(lost.activeGesture).toBeNull();
    expect(lost.progress).toBe(0);

    // Starting again starts progress from 0
    const restarted = tracker.update("thumbs_up", 1400);
    expect(restarted.progress).toBe(0);
  });
});

describe("Gesture Action Remapping & Sensitivity Configuration", () => {
  it("provides complete default mappings for all 8 gestures", () => {
    const gestures: HandGesture[] = [
      "pinch",
      "open_palm",
      "fist",
      "thumbs_up",
      "swipe_left",
      "swipe_right",
      "swipe_up",
      "swipe_down",
    ];

    for (const g of gestures) {
      expect(DEFAULT_GESTURE_MAPPING[g]).toBeDefined();
    }

    expect(DEFAULT_GESTURE_MAPPING.swipe_right).toBe("next_job");
    expect(DEFAULT_GESTURE_MAPPING.swipe_left).toBe("previous_job");
    expect(DEFAULT_GESTURE_MAPPING.pinch).toBe("select");
    expect(DEFAULT_GESTURE_MAPPING.thumbs_up).toBe("save_job");
    expect(DEFAULT_GESTURE_MAPPING.fist).toBe("pause_gestures");
    expect(DEFAULT_GESTURE_MAPPING.open_palm).toBe("back");
  });

  it("supports custom remapping and disabling gestures", () => {
    const customMapping = {
      ...DEFAULT_GESTURE_MAPPING,
      pinch: "save_job" as const,
      open_palm: "none" as const,
    };

    expect(customMapping.pinch).toBe("save_job");
    expect(customMapping.open_palm).toBe("none");
  });

  it("adjusts hold times and swipe thresholds across sensitivity settings", () => {
    expect(SENSITIVITY_SETTINGS.low.holdTimeMs).toBeGreaterThan(
      SENSITIVITY_SETTINGS.medium.holdTimeMs,
    );
    expect(SENSITIVITY_SETTINGS.medium.holdTimeMs).toBeGreaterThan(
      SENSITIVITY_SETTINGS.high.holdTimeMs,
    );
    expect(SENSITIVITY_SETTINGS.high.swipeThreshold).toBeLessThan(
      SENSITIVITY_SETTINGS.low.swipeThreshold,
    );
  });
});
