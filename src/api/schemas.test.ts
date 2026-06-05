import { expect, test } from "vitest";
import {
  incidentDetailSchema,
  incidentsResponseSchema,
  wrappedKeyResponseSchema,
  wrappedKeysResponseSchema,
} from "./schemas";

test("incident list parsing drops private owner and storage fields", () => {
  const parsed = incidentsResponseSchema.parse({
    incidents: [
      {
        id: "inc_test",
        created_at: "2026-06-01T00:00:00Z",
        updated_at: "2026-06-01T00:10:00Z",
        status: "open",
        client_label: "owner phone",
        incident_mode: "interaction_record",
        capture_profile: "audio_location",
        escalation_policy: "none",
        sharing_state: "private",
        deletion_state: "active",
        owner_account_id: "acct_private",
        notes: "private note",
        stored_path: "incidents/inc_test/private.enc",
        object_key: "private/object/key",
        wrapped_key_ciphertext: "wrapped-ciphertext",
        plaintext: "private plaintext",
        raw_key: "raw-key",
      },
    ],
  });

  expect(parsed.incidents).toHaveLength(1);
  const incident = parsed.incidents[0];
  expect(incident).toBeDefined();
  if (!incident) {
    throw new Error("expected parsed incident");
  }
  expect(incident).toMatchObject({
    id: "inc_test",
    status: "open",
    client_label: "owner phone",
    incident_mode: "interaction_record",
    capture_profile: "audio_location",
    escalation_policy: "none",
    sharing_state: "private",
    deletion_state: "active",
  });
  expect("owner_account_id" in incident).toBe(false);
  expect("notes" in incident).toBe(false);
  expect("stored_path" in incident).toBe(false);
  expect("object_key" in incident).toBe(false);
  expect("wrapped_key_ciphertext" in incident).toBe(false);
  expect("plaintext" in incident).toBe(false);
  expect("raw_key" in incident).toBe(false);
});

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

const wrappedKeyFixture = {
  wrapped_key_id: "wkey_test",
  owner_account_id: "acct_test",
  incident_id: "inc_test",
  stream_id: null,
  grant_id: "sgr_test",
  recipient_type: "trusted_contact",
  contact_id: "ctc_test",
  contact_public_key_id: "cpk_test",
  contact_public_key_version: 1,
  media_key_id: "media-key-test",
  wrapping_algorithm: "age-v1-x25519",
  wrapping_algorithm_version: "1",
  wrapped_key_ciphertext: "wrapped-ciphertext",
  public_wrapping_metadata: {
    ephemeral_public_key: "public-metadata",
  },
  wrapped_key_state: "active",
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
};

test("wrapped-key list parsing drops wrapped-key ciphertext", () => {
  const parsed = wrappedKeysResponseSchema.parse({
    wrapped_keys: [wrappedKeyFixture],
  });

  expect(parsed.wrapped_keys).toHaveLength(1);
  const wrappedKey = parsed.wrapped_keys[0];
  expect(wrappedKey).toBeDefined();
  if (!wrappedKey) {
    throw new Error("expected parsed wrapped key");
  }
  expect(wrappedKey).toMatchObject({
    wrapped_key_id: "wkey_test",
    incident_id: "inc_test",
    grant_id: "sgr_test",
    media_key_id: "media-key-test",
    wrapping_algorithm: "age-v1-x25519",
    public_wrapping_metadata: {
      ephemeral_public_key: "public-metadata",
    },
    wrapped_key_state: "active",
  });
  expect("wrapped_key_ciphertext" in wrappedKey).toBe(false);
});

test("wrapped-key detail parsing drops wrapped-key ciphertext", () => {
  const parsed = wrappedKeyResponseSchema.parse({
    wrapped_key: wrappedKeyFixture,
  });

  expect(parsed.wrapped_key).toMatchObject({
    wrapped_key_id: "wkey_test",
    contact_id: "ctc_test",
    contact_public_key_id: "cpk_test",
    wrapped_key_state: "active",
  });
  expect("wrapped_key_ciphertext" in parsed.wrapped_key).toBe(false);
});
