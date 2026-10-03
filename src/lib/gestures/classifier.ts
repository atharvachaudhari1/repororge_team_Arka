import type {
  Landmark,
  StaticGesture,
  DynamicGesture,
  HandGesture,
  TimestampedLandmark,
} from "./types";

/**
 * Standard Euclidean distance between two 2D points.
 */
export function distance2D(p1: Landmark, p2: Landmark): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

/**
 * Computes the center of the palm from the wrist and finger base joints.
 */
export function getPalmCenter(landmarks: Landmark[]): Landmark {
  const wrist = landmarks[0]!;
  const indexMcp = landmarks[5]!;
  const middleMcp = landmarks[9]!;
  const pinkyMcp = landmarks[17]!;

  return {
    x: (wrist.x + indexMcp.x + middleMcp.x + pinkyMcp.x) / 4,
    y: (wrist.y + indexMcp.y + middleMcp.y + pinkyMcp.y) / 4,
    z: (wrist.z + indexMcp.z + middleMcp.z + pinkyMcp.z) / 4,
  };
}

/**
 * Checks whether a single finger (index, middle, ring, pinky) is extended.
 */
export function isFingerExtended(
  landmarks: Landmark[],
  tipIdx: number,
  pipIdx: number,
  mcpIdx: number,
): boolean {
  const wrist = landmarks[0]!;
  const tip = landmarks[tipIdx]!;
  const pip = landmarks[pipIdx]!;
  const mcp = landmarks[mcpIdx]!;

  const tipToWrist = distance2D(tip, wrist);
  const pipToWrist = distance2D(pip, wrist);
  const tipToMcp = distance2D(tip, mcp);
  const pipToMcp = distance2D(pip, mcp);

  // Finger is extended if tip is clearly further from wrist and MCP than PIP joint
  return tipToWrist > pipToWrist * 1.1 && tipToMcp > pipToMcp * 1.15;
}

/**
 * Checks whether the thumb is extended away from the palm.
 */
export function isThumbExtended(landmarks: Landmark[]): boolean {
  const thumbTip = landmarks[4]!;
  const thumbMcp = landmarks[2]!;
  const pinkyMcp = landmarks[17]!;
  const indexMcp = landmarks[5]!;

  const tipToPinky = distance2D(thumbTip, pinkyMcp);
  const mcpToPinky = distance2D(thumbMcp, pinkyMcp);
  const tipToIndex = distance2D(thumbTip, indexMcp);

  return tipToPinky > mcpToPinky * 1.15 && tipToIndex > 0.12;
}

/**
 * Pure function to classify static hand posture from 21 landmarks.
 */
export function classifyStaticPose(
  landmarks: Landmark[],
  options: { pinchDistance?: number | undefined } = {},
): StaticGesture | null {
  if (!landmarks || landmarks.length < 21) {
    return null;
  }

  const pinchThreshold = options.pinchDistance ?? 0.075;

  const thumbTip = landmarks[4]!;
  const indexTip = landmarks[8]!;
  const middleTip = landmarks[12]!;
  const ringTip = landmarks[16]!;
  const pinkyTip = landmarks[20]!;
  const wrist = landmarks[0]!;

  const indexExtended = isFingerExtended(landmarks, 8, 6, 5);
  const middleExtended = isFingerExtended(landmarks, 12, 10, 9);
  const ringExtended = isFingerExtended(landmarks, 16, 14, 13);
  const pinkyExtended = isFingerExtended(landmarks, 20, 18, 17);
  const thumbExtended = isThumbExtended(landmarks);

  const fingersExtendedCount =
    (indexExtended ? 1 : 0) +
    (middleExtended ? 1 : 0) +
    (ringExtended ? 1 : 0) +
    (pinkyExtended ? 1 : 0);

  // 1. PINCH: thumb tip and index tip are very close, but middle finger is not touching
  const thumbIndexDist = distance2D(thumbTip, indexTip);
  const thumbMiddleDist = distance2D(thumbTip, middleTip);
  if (thumbIndexDist <= pinchThreshold && thumbMiddleDist > pinchThreshold * 1.3) {
    return "pinch";
  }

  // 2. THUMBS_UP: 4 fingers curled into fist, thumb pointing upward
  if (fingersExtendedCount === 0) {
    const thumbIp = landmarks[3]!;
    const thumbMcp = landmarks[2]!;
    // In camera coordinates, y is inverted (0 is top, 1 is bottom)
    const isPointingUp =
      thumbTip.y < thumbIp.y - 0.03 && thumbIp.y < thumbMcp.y && wrist.y - thumbTip.y > 0.1;

    if (isPointingUp) {
      return "thumbs_up";
    }

    // 3. FIST: all 4 fingers curled, thumb not pointing up
    return "fist";
  }

  // 4. OPEN_PALM: all 4 fingers extended, thumb extended, palm wide
  if (fingersExtendedCount >= 4 && thumbExtended) {
    // Ensure tips are well spread from wrist
    const avgTipDist =
      (distance2D(indexTip, wrist) +
        distance2D(middleTip, wrist) +
        distance2D(ringTip, wrist) +
        distance2D(pinkyTip, wrist)) /
      4;

    if (avgTipDist > 0.25) {
      return "open_palm";
    }
  }

  return null;
}

/**
 * Pure function to classify dynamic swipe gestures from a history buffer of landmarks.
 */
export function classifySwipeGesture(
  current: Landmark[],
  history: TimestampedLandmark[],
  options: {
    swipeThreshold?: number | undefined;
    minDurationMs?: number | undefined;
    maxDurationMs?: number | undefined;
  } = {},
): DynamicGesture | null {
  if (!history || history.length < 2 || !current || current.length < 21) {
    return null;
  }

  const threshold = options.swipeThreshold ?? 0.16;
  const minDuration = options.minDurationMs ?? 80;
  const maxDuration = options.maxDurationMs ?? 500;

  const now = history[history.length - 1]?.timestamp ?? Date.now();
  // Filter history to relevant temporal window
  const windowItems = history.filter(
    (h) => now - h.timestamp >= minDuration && now - h.timestamp <= maxDuration,
  );

  if (!windowItems.length) {
    return null;
  }

  // Use the earliest point in the window as reference
  const oldest = windowItems[0]!;
  if (!oldest.landmarks || oldest.landmarks.length < 21) {
    return null;
  }

  const currentCenter = getPalmCenter(current);
  const oldestCenter = getPalmCenter(oldest.landmarks);

  const dx = currentCenter.x - oldestCenter.x;
  const dy = currentCenter.y - oldestCenter.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // Horizontal swipe: horizontal motion must dominate vertical motion
  if (absDx >= threshold && absDx > absDy * 1.4) {
    return dx > 0 ? "swipe_right" : "swipe_left";
  }

  // Vertical swipe: vertical motion must dominate horizontal motion
  // Note: in screen space, dy < 0 means moving upward
  if (absDy >= threshold && absDy > absDx * 1.4) {
    return dy < 0 ? "swipe_up" : "swipe_down";
  }

  return null;
}

/**
 * Unified pure gesture classifier: checks for dynamic gestures first (swipes),
 * then falls back to static pose classification (pinch, open_palm, fist, thumbs_up).
 */
export function classifyGesture(
  landmarks: Landmark[],
  history?: TimestampedLandmark[] | undefined,
  options: {
    pinchDistance?: number | undefined;
    swipeThreshold?: number | undefined;
  } = {},
): HandGesture | null {
  if (!landmarks || landmarks.length < 21) return null;

  if (history && history.length >= 2) {
    const swipe = classifySwipeGesture(landmarks, history, {
      swipeThreshold: options.swipeThreshold,
    });
    if (swipe) {
      return swipe;
    }
  }

  return classifyStaticPose(landmarks, {
    pinchDistance: options.pinchDistance,
  });
}
