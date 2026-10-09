import { describe, it, expect } from "vitest";
import { cn } from "../src/lib/utils";
import { describeError } from "../src/lib/error-capture";
import { EMPTY_PROFILE, DEFAULT_VOICE_NAV_CONFIG } from "../src/lib/app-state";

describe("Phase 1: Design System & Foundation", () => {
  describe("Utility Classnames (cn)", () => {
    it("merges Tailwind and standard class names correctly", () => {
      const result = cn("p-4", "text-sm", undefined, "p-2");
      expect(result).toBe("text-sm p-2");
    });
  });

  describe("Error Normalization & Capture", () => {
    it("safely describes error stacks and messages", () => {
      const testError = new Error("Test SSR boundary error");
      const described = describeError(testError);
      expect(described).toContain("Test SSR boundary error");
    });

    it("handles non-Error objects safely", () => {
      const described = describeError({ custom: "failure" });
      expect(described).toContain("custom");
    });
  });

  describe("Accessible State Defaults", () => {
    it("provides privacy-first candidate defaults", () => {
      expect(EMPTY_PROFILE.shareDisplayName).toBe(true);
      expect(EMPTY_PROFILE.shareLegalName).toBe(false);
      expect(EMPTY_PROFILE.shareOtherPersonal).toBe(false);
    });

    it("has voice navigation defaults disabled initially", () => {
      expect(DEFAULT_VOICE_NAV_CONFIG.enabled).toBe(false);
      expect(DEFAULT_VOICE_NAV_CONFIG.wakeWord).toBe("Jarvis");
    });
  });
});
