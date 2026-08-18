export interface TranscriptMeta {
  visitType?: string;
  duration?: string;
  speakers: string[];
}

export interface TranscriptTurn {
  speaker: string;
  text: string;
}

export interface ParsedTranscript {
  meta: TranscriptMeta;
  turns: TranscriptTurn[];
}

const HEADER_LINE = /^(VISIT|DURATION|SPEAKERS):\s*(.*)$/;
const TURN_START = /^([A-Z][A-Z ]*):\s?(.*)$/;
const STAGE_DIRECTION = /^\[.*\]$/;

// Splits a "SPEAKERS:" list on commas, ignoring commas nested inside
// parentheses (e.g. "PATIENT (F, 61)" is one entry, not two).
function splitSpeakersList(value: string): string[] {
  const entries: string[] = [];
  let depth = 0;
  let current = "";

  for (const char of value) {
    if (char === "(") depth++;
    if (char === ")") depth = Math.max(0, depth - 1);

    if (char === "," && depth === 0) {
      entries.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) entries.push(current.trim());

  return entries.filter(Boolean);
}

export function parseTranscript(raw: string): ParsedTranscript {
  if (!raw || !raw.trim()) {
    throw new Error("Transcript is empty");
  }

  const meta: TranscriptMeta = { speakers: [] };
  const turns: TranscriptTurn[] = [];
  let currentTurn: TranscriptTurn | null = null;
  let inHeader = true;

  for (const rawLine of raw.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    if (inHeader) {
      const headerMatch = line.match(HEADER_LINE);
      if (headerMatch) {
        const [, key, value] = headerMatch;
        if (key === "VISIT") meta.visitType = value.trim();
        else if (key === "DURATION") meta.duration = value.trim();
        else if (key === "SPEAKERS") {
          meta.speakers = splitSpeakersList(value);
        }
        continue;
      }
      inHeader = false;
    }

    if (STAGE_DIRECTION.test(line)) continue;

    const turnMatch = line.match(TURN_START);
    if (turnMatch) {
      const [, speaker, text] = turnMatch;
      currentTurn = { speaker: speaker.trim(), text: text.trim() };
      turns.push(currentTurn);
    } else if (currentTurn) {
      currentTurn.text = `${currentTurn.text} ${line}`.trim();
    }
  }

  if (turns.length === 0) {
    throw new Error("No parseable dialogue turns found in transcript");
  }

  return { meta, turns };
}
