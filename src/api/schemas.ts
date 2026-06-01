import { z } from "zod";

export const accountSchema = z.object({
  id: z.string(),
  username: z.string(),
  role: z.enum(["user", "admin"]),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  password_changed_at: z.string().optional(),
});

export const loginResponseSchema = z.object({
  session_id: z.string(),
  account: accountSchema,
  token: z.string(),
  created_at: z.string(),
  expires_at: z.string(),
});

export const sessionSchema = z.object({
  sessionId: z.string(),
  account: accountSchema,
  token: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
  mode: z.enum(["mock", "live"]),
});

export const incidentSchema = z.object({
  id: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  status: z.enum(["open", "closed"]).or(z.string()),
  client_label: z.string().optional(),
  incident_mode: z.string().optional(),
  capture_profile: z.string().optional(),
  escalation_policy: z.string().optional(),
  sharing_state: z.string().optional(),
  deletion_state: z.string().optional(),
});

export const streamSchema = z.object({
  id: z.string(),
  incident_id: z.string(),
  media_type: z.string(),
  status: z.string(),
  chunk_count: z.number().optional(),
  byte_size: z.number().optional(),
  started_at: z.string().optional(),
  completed_at: z.string().nullable().optional(),
  failed_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const chunkSchema = z.object({
  id: z.string(),
  incident_id: z.string(),
  stream_id: z.string().nullable().optional(),
  chunk_index: z.number(),
  media_type: z.string(),
  started_at: z.string().optional(),
  ended_at: z.string().optional(),
  original_filename: z.string().optional(),
  byte_size: z.number().optional(),
  sha256_hex: z.string().optional(),
  created_at: z.string().optional(),
});

export const checkinSchema = z.object({
  id: z.string().optional(),
  incident_id: z.string().optional(),
  note: z.string().optional(),
  created_at: z.string().optional(),
});

export const incidentDetailSchema = z.object({
  incident: incidentSchema,
  streams: z.array(streamSchema).default([]),
  chunks: z.array(chunkSchema).default([]),
  checkins: z.array(checkinSchema).default([]),
});

export const contactPublicKeySchema = z.object({
  public_key_id: z.string(),
  owner_account_id: z.string().optional(),
  contact_id: z.string(),
  version: z.number().optional(),
  display_label: z.string().optional(),
  wrapping_algorithm: z.string(),
  public_key: z.string().optional(),
  public_key_fingerprint: z.string(),
  key_state: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const contactPublicKeysResponseSchema = z.object({
  contact_public_keys: z.array(contactPublicKeySchema),
});

export const contactPublicKeyResponseSchema = z.object({
  contact_public_key: contactPublicKeySchema,
});

export const sharingGrantSchema = z.object({
  grant_id: z.string(),
  owner_account_id: z.string().optional(),
  incident_id: z.string(),
  stream_id: z.string().nullable().optional(),
  recipient_type: z.string(),
  contact_id: z.string(),
  contact_public_key_id: z.string(),
  contact_public_key_version: z.number().optional(),
  data_class: z.string(),
  grant_state: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  expires_at: z.string().nullable().optional(),
});

export const sharingGrantsResponseSchema = z.object({
  sharing_grants: z.array(sharingGrantSchema),
});

export const sharingGrantResponseSchema = z.object({
  sharing_grant: sharingGrantSchema,
});

export const wrappedKeySchema = z.object({
  wrapped_key_id: z.string(),
  owner_account_id: z.string().optional(),
  incident_id: z.string(),
  stream_id: z.string().nullable().optional(),
  grant_id: z.string(),
  recipient_type: z.string(),
  contact_id: z.string(),
  contact_public_key_id: z.string(),
  contact_public_key_version: z.number().optional(),
  media_key_id: z.string(),
  wrapping_algorithm: z.string(),
  wrapping_algorithm_version: z.string().optional(),
  wrapped_key_ciphertext: z.string().optional(),
  public_wrapping_metadata: z.record(z.string(), z.unknown()).optional(),
  wrapped_key_state: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const wrappedKeysResponseSchema = z.object({
  wrapped_keys: z.array(wrappedKeySchema),
});

export const wrappedKeyResponseSchema = z.object({
  wrapped_key: wrappedKeySchema,
});

export type Account = z.infer<typeof accountSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type Incident = z.infer<typeof incidentSchema>;
export type IncidentDetail = z.infer<typeof incidentDetailSchema>;
export type Stream = z.infer<typeof streamSchema>;
export type Chunk = z.infer<typeof chunkSchema>;
export type ContactPublicKey = z.infer<typeof contactPublicKeySchema>;
export type SharingGrant = z.infer<typeof sharingGrantSchema>;
export type WrappedKey = z.infer<typeof wrappedKeySchema>;
