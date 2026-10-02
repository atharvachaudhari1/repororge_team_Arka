import { describe, it, expect } from "vitest";
import { getCoordinatesForCity, getCoordinatesForJob, getOffsetCoordinates } from "@/lib/locations";
import type { Job } from "@/lib/jobs-data";

describe("Geospatial & Mapping Utilities", () => {
  it("resolves exact coordinates for standard Indian tech hubs", () => {
    const bengaluru = getCoordinatesForCity("Bengaluru");
    expect(bengaluru.lat).toBeCloseTo(12.9716, 2);
    expect(bengaluru.lng).toBeCloseTo(77.5946, 2);

    const mumbai = getCoordinatesForCity("Mumbai");
    expect(mumbai.lat).toBeCloseTo(19.076, 2);
    expect(mumbai.lng).toBeCloseTo(72.8777, 2);
  });

  it("resolves specific commercial zones for micro-location job descriptions", () => {
    const bkcJob = {
      title: "Senior Risk Analyst",
      company: "Deccan Financial",
      city: "Mumbai, BKC",
      workMode: "Hybrid",
      description: "Based in Bandra Kurla Complex G Block.",
    } as unknown as Job;

    const coords = getCoordinatesForJob(bkcJob);
    expect(coords.lat).toBeCloseTo(19.0665, 2);
    expect(coords.lng).toBeCloseTo(72.8685, 2);
  });

  it("applies reproducible non-overlapping offsets for collocated jobs", () => {
    const base = { lat: 19.076, lng: 72.8777 };
    const first = getOffsetCoordinates(base, 0, 3);
    const second = getOffsetCoordinates(base, 1, 3);

    expect(first.lat).not.toBe(second.lat);
    expect(first.lng).not.toBe(second.lng);
  });
});
