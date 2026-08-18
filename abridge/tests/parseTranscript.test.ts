import { describe, expect, it } from "vitest";
import { parseTranscript } from "../src/parseTranscript";
import { SAMPLE_TRANSCRIPT } from "./fixtures";

describe("parseTranscript", () => {
  it("parses the header metadata from the sample transcript", () => {
    const { meta } = parseTranscript(SAMPLE_TRANSCRIPT);

    expect(meta.visitType).toBe("New patient, chest discomfort");
    expect(meta.duration).toBe("14 min");
    expect(meta.speakers).toEqual([
      "CLINICIAN (Dr. Okafor)",
      "PATIENT (F, 61)",
      "DAUGHTER",
    ]);
  });

  it("splits the sample transcript into speaker-attributed turns", () => {
    const { turns } = parseTranscript(SAMPLE_TRANSCRIPT);

    expect(turns.length).toBeGreaterThan(0);
    expect(turns[0]).toEqual({
      speaker: "CLINICIAN",
      text: "So tell me what's been going on.",
    });
    expect(turns.every((t) => ["CLINICIAN", "PATIENT", "DAUGHTER"].includes(t.speaker))).toBe(
      true
    );
  });

  it("excludes stage directions like [pause] from the turns", () => {
    const { turns } = parseTranscript(SAMPLE_TRANSCRIPT);

    expect(turns.some((t) => t.text.includes("[pause]"))).toBe(false);
    expect(turns.some((t) => t.speaker === "STAGE_DIRECTION")).toBe(false);
  });

  it("keeps a multi-sentence single-speaker turn as one turn", () => {
    const { turns } = parseTranscript(SAMPLE_TRANSCRIPT);

    const safetyNetTurn = turns.find((t) => t.text.includes("call 911"));
    expect(safetyNetTurn).toBeDefined();
    expect(safetyNetTurn?.speaker).toBe("CLINICIAN");
    expect(safetyNetTurn?.text).toContain("Avoid heavy exertion");
    expect(safetyNetTurn?.text).toContain("Don't drive yourself");
  });

  it("captures the late-revealed penicillin allergy as its own turn, distinct from the earlier denial", () => {
    const { turns } = parseTranscript(SAMPLE_TRANSCRIPT);

    const denial = turns.find((t) => t.text === "No allergies.");
    const revelation = turns.find((t) => t.text.includes("penicillin"));

    expect(denial).toBeDefined();
    expect(revelation).toBeDefined();
    expect(denial).not.toBe(revelation);
  });

  it("does not split a turn on a colon that appears inside the dialogue text", () => {
    const transcript = `VISIT: Test
DURATION: 1 min
SPEAKERS: CLINICIAN, PATIENT

PATIENT: It's like this: pressure.
CLINICIAN: Understood.`;

    const { turns } = parseTranscript(transcript);

    expect(turns).toEqual([
      { speaker: "PATIENT", text: "It's like this: pressure." },
      { speaker: "CLINICIAN", text: "Understood." },
    ]);
  });

  it("parses turns even when the header block is missing", () => {
    const transcript = `CLINICIAN: Hello.
PATIENT: Hi there.`;

    const { meta, turns } = parseTranscript(transcript);

    expect(meta.visitType).toBeUndefined();
    expect(meta.duration).toBeUndefined();
    expect(meta.speakers).toEqual([]);
    expect(turns).toEqual([
      { speaker: "CLINICIAN", text: "Hello." },
      { speaker: "PATIENT", text: "Hi there." },
    ]);
  });

  it("tolerates irregular blank lines and spacing between turns", () => {
    const transcript = `VISIT: Test
DURATION: 1 min
SPEAKERS: CLINICIAN, PATIENT


CLINICIAN:    Hello there.


PATIENT:   Hi.

`;

    const { turns } = parseTranscript(transcript);

    expect(turns).toEqual([
      { speaker: "CLINICIAN", text: "Hello there." },
      { speaker: "PATIENT", text: "Hi." },
    ]);
  });

  it("joins a continuation line without a speaker prefix into the previous turn", () => {
    const transcript = `CLINICIAN: This is a long sentence
that wraps onto a second line.
PATIENT: Okay.`;

    const { turns } = parseTranscript(transcript);

    expect(turns[0]).toEqual({
      speaker: "CLINICIAN",
      text: "This is a long sentence that wraps onto a second line.",
    });
    expect(turns[1]).toEqual({ speaker: "PATIENT", text: "Okay." });
  });

  it("throws a clear error for an empty transcript", () => {
    expect(() => parseTranscript("")).toThrow("Transcript is empty");
    expect(() => parseTranscript("   \n  ")).toThrow("Transcript is empty");
  });

  it("throws a clear error when there are no parseable dialogue turns", () => {
    expect(() => parseTranscript("just some prose with no speaker labels at all")).toThrow(
      "No parseable dialogue turns found in transcript"
    );
  });
});
