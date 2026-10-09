/**
 * Spoken English Number Parser
 * Converts spoken number phrases ("one", "two", "twenty three", "first", "4th") into integers.
 */

const SMALL_NUMBERS: Record<string, number> = {
  zero: 0,
  one: 1,
  won: 1,
  first: 1,
  two: 2,
  to: 2,
  too: 2,
  second: 2,
  three: 3,
  third: 3,
  four: 4,
  for: 4,
  fourth: 4,
  five: 5,
  fifth: 5,
  six: 6,
  sixth: 6,
  seven: 7,
  seventh: 7,
  eight: 8,
  ate: 8,
  eighth: 8,
  nine: 9,
  ninth: 9,
  ten: 10,
  tenth: 10,
  eleven: 11,
  eleventh: 11,
  twelve: 12,
  twelfth: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};

const TENS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fourty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

/**
 * Extracts a number from a string, supporting digits ("3", "14") or spoken words ("three", "twenty one").
 * Returns null if no number is identified.
 */
export function extractSpokenNumber(input: string): number | null {
  if (!input) return null;
  const clean = input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim();

  // 1. Direct digit match
  const digitMatch = clean.match(/\b\d+\b/);
  if (digitMatch) {
    const parsed = parseInt(digitMatch[0] ?? "", 10);
    if (!isNaN(parsed) && parsed >= 0) return parsed;
  }

  // 2. Ordinal digit match ("1st", "2nd", "3rd", "4th")
  const ordinalMatch = clean.match(/\b(\d+)(st|nd|rd|th)\b/);
  if (ordinalMatch) {
    const parsed = parseInt(ordinalMatch[1] ?? "", 10);
    if (!isNaN(parsed) && parsed >= 0) return parsed;
  }

  const words = clean.split(/[\s-]+/).filter(Boolean);

  // Check two-word combos first ("twenty five" -> 25)
  for (let i = 0; i < words.length - 1; i++) {
    const tensVal = TENS[words[i] ?? ""];
    const onesVal = SMALL_NUMBERS[words[i + 1] ?? ""];
    if (tensVal !== undefined && onesVal !== undefined && onesVal < 10) {
      return tensVal + onesVal;
    }
  }

  // Check single tens ("twenty", "thirty")
  for (const w of words) {
    const value = TENS[w];
    if (value !== undefined) {
      return value;
    }
  }

  // Check small numbers ("one", "three", etc.)
  for (const w of words) {
    const value = SMALL_NUMBERS[w];
    if (value !== undefined) {
      return value;
    }
  }

  return null;
}
