import { expect, test } from "vitest";
import { incidentDetailSchema } from "./schemas";

test("incident detail parsing drops private chunk storage paths", () => {
  const parsed = incidentDetailSchema.parse({
    incident: {
      id: "inc_test",
      status: "open",
      created_at: "2026-06-01T00:00:00Z",
      updated_at: "2026-06-01T00:00:00Z",
    },
    streams: [],
    chunks: [
      {
        id: "chk_test",
        incident_id: "inc_test",
        stream_id: "str_test",
        chunk_index: 1,
        media_type: "audio",
        started_at: "2026-06-01T00:00:00Z",
        ended_at: "2026-06-01T00:00:10Z",
        original_filename: "chunk.enc",
        stored_path: "incidents/inc_test/streams/str_test/audio_000001.enc",
        byte_size: 23,
        sha256_hex:
          "4f1ef7673557c98ec30a1e83d75f6a5b4796e08f4b2f470582d8d91f73c4bb5d",
        created_at: "2026-06-01T00:00:11Z",
      },
    ],
    checkins: [],
  });

  expect(parsed.chunks).toHaveLength(1);
  const chunk = parsed.chunks[0];
  expect(chunk).toBeDefined();
  if (!chunk) {
    throw new Error("expected parsed chunk");
  }
  expect(chunk).toMatchObject({
    id: "chk_test",
    incident_id: "inc_test",
    stream_id: "str_test",
    chunk_index: 1,
    media_type: "audio",
    original_filename: "chunk.enc",
    byte_size: 23,
    sha256_hex:
      "4f1ef7673557c98ec30a1e83d75f6a5b4796e08f4b2f470582d8d91f73c4bb5d",
  });
  expect("stored_path" in chunk).toBe(false);
});
