import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/server";
import { SAMPLE_TRANSCRIPT } from "./fixtures";

describe("GET /health", () => {
  it("returns 200 ok", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("POST /api/transcripts/parse", () => {
  it("returns 200 with parsed meta and turns for a valid transcript", async () => {
    const res = await request(app)
      .post("/api/transcripts/parse")
      .send({ transcript: SAMPLE_TRANSCRIPT });

    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({
      visitType: "New patient, chest discomfort",
      duration: "14 min",
      speakers: ["CLINICIAN (Dr. Okafor)", "PATIENT (F, 61)", "DAUGHTER"],
    });
    expect(Array.isArray(res.body.turns)).toBe(true);
    expect(res.body.turns.length).toBeGreaterThan(0);
    expect(res.body.turns[0]).toEqual({
      speaker: "CLINICIAN",
      text: "So tell me what's been going on.",
    });
  });

  it("returns 400 when transcript field is missing", async () => {
    const res = await request(app).post("/api/transcripts/parse").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/transcript is required/i);
  });

  it("returns 400 when transcript is an empty string", async () => {
    const res = await request(app)
      .post("/api/transcripts/parse")
      .send({ transcript: "   " });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/transcript is required/i);
  });

  it("returns 400 when transcript is not a string", async () => {
    const res = await request(app)
      .post("/api/transcripts/parse")
      .send({ transcript: 12345 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/transcript is required/i);
  });

  it("returns 400 when transcript exceeds the size cap", async () => {
    const oversized = "CLINICIAN: " + "a".repeat(20000);

    const res = await request(app)
      .post("/api/transcripts/parse")
      .send({ transcript: oversized });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/exceeds/i);
  });

  it("returns 400 when transcript has no parseable dialogue turns", async () => {
    const res = await request(app)
      .post("/api/transcripts/parse")
      .send({ transcript: "no speaker labels here, just prose" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no parseable dialogue turns/i);
  });
});
