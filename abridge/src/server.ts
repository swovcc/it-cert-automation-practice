import express from "express";
import { parseTranscript } from "./parseTranscript";

const MAX_TRANSCRIPT_LENGTH = 20000;

export const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/transcripts/parse", (req, res) => {
  const { transcript } = req.body ?? {};

  if (typeof transcript !== "string" || !transcript.trim()) {
    return res.status(400).json({ error: "transcript is required" });
  }
  if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
    return res
      .status(400)
      .json({ error: `transcript exceeds ${MAX_TRANSCRIPT_LENGTH} character limit` });
  }

  try {
    return res.status(200).json(parseTranscript(transcript));
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
});

if (require.main === module) {
  const port = process.env.PORT ?? 3000;
  app.listen(port, () => console.log(`listening on ${port}`));
}
