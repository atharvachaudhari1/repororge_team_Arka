import { describe, expect, it } from "vitest";
import { parseVoiceCommand, stripWakeWord } from "@/lib/voice/command-parser";
import { extractSpokenNumber } from "@/lib/voice/words-to-numbers";

describe("JARVIS voice command parser", () => {
  it("understands spoken numbers for click-by-number navigation", () => {
    expect(extractSpokenNumber("twenty one")).toBe(21);
    expect(extractSpokenNumber("the fourth target")).toBe(4);
    expect(parseVoiceCommand("Hey Jarvis, click twenty one")?.type).toBe("click_number");
    expect(parseVoiceCommand("Hey Jarvis, click twenty one")?.payload).toBe(21);
  });

  it("requires a wake word when that safety setting is enabled", () => {
    expect(parseVoiceCommand("open dashboard", { wakeWordRequired: true })).toBeNull();
    expect(parseVoiceCommand("Hey Jarvis, open dashboard", { wakeWordRequired: true })?.type).toBe(
      "nav_dashboard",
    );
    expect(stripWakeWord("Hey Jarvis, show numbers")).toEqual({
      hasWakeWord: true,
      cleanText: "show numbers",
    });
  });

  it("accepts one normal command after the wake-word command window opens", () => {
    // The hook opens this window for eight seconds after "Hey Jarvis".
    expect(parseVoiceCommand("open jobs", { wakeWordRequired: false })?.type).toBe("nav_jobs");
    expect(parseVoiceCommand("scroll down", { wakeWordRequired: false })?.type).toBe("scroll_down");
  });

  it("only wakes from standby until explicitly resumed", () => {
    expect(parseVoiceCommand("scroll down", { isSleeping: true })).toBeNull();
    expect(parseVoiceCommand("wake up", { isSleeping: true })?.type).toBe("wake");
  });

  it("maps navigation, page controls, and search to safe commands", () => {
    expect(parseVoiceCommand("Hey Jarvis, go to jobs")?.type).toBe("nav_jobs");
    expect(parseVoiceCommand("Hey Jarvis, scroll to bottom")?.type).toBe("scroll_bottom");
    expect(parseVoiceCommand("Hey Jarvis, search for accessible designer in Pune")?.payload).toBe(
      "accessible designer in pune",
    );
  });

  it("selects a job result by spoken ordinal instead of a numbered overlay", () => {
    const command = parseVoiceCommand("Hey Jarvis, select the first job");
    expect(command?.type).toBe("select_job");
    expect(command?.payload).toBe(1);
  });
});
