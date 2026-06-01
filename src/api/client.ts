import {
  contactPublicKeyResponseSchema,
  contactPublicKeysResponseSchema,
  incidentDetailSchema,
  incidentListResponseSchema,
  loginResponseSchema,
  sharingGrantResponseSchema,
  sharingGrantsResponseSchema,
  wrappedKeyResponseSchema,
  wrappedKeysResponseSchema,
  type Account,
  type ContactPublicKey,
  type Incident,
  type IncidentDetail,
  type LoginResponse,
  type SharingGrant,
  type WrappedKey,
} from "./schemas";
import { apiErrorFromResponse } from "./errors";

type ClientMode = "mock" | "live";

type ClientOptions = {
  baseUrl?: string;
  mode?: ClientMode;
  getToken?: () => string | null;
};

export const prooflineQueryKeys = {
  account: ["account"] as const,
  incidents: ["incidents"] as const,
  incident: (incidentId: string) => ["incident", incidentId] as const,
  contactPublicKeys: ["contact-public-keys"] as const,
  sharingGrants: (incidentId: string) =>
    ["sharing-grants", incidentId] as const,
  wrappedKeys: (incidentId: string) => ["wrapped-keys", incidentId] as const,
};

const defaultBaseUrl =
  import.meta.env.VITE_PROOFLINE_API_BASE_URL ?? "http://127.0.0.1:8080";

const defaultMode: ClientMode =
  import.meta.env.VITE_PROOFLINE_API_MODE === "live" ? "live" : "mock";

const mockAccount: Account = {
  id: "acct_prototype",
  username: "prototype-user",
  role: "user",
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
};

const mockIncidents: Incident[] = [
  {
    id: "inc_prototype_001",
    status: "open",
    client_label: "prototype review",
    incident_mode: "interaction_record",
    capture_profile: "audio_location",
    escalation_policy: "none",
    sharing_state: "private",
    deletion_state: "active",
    created_at: "2026-06-01T01:00:00Z",
    updated_at: "2026-06-01T01:18:00Z",
  },
  {
    id: "inc_prototype_002",
    status: "closed",
    client_label: "metadata-only sample",
    incident_mode: "evidence_note",
    capture_profile: "note_or_attachment",
    escalation_policy: "none",
    sharing_state: "trusted_contact_access",
    deletion_state: "active",
    created_at: "2026-05-31T11:20:00Z",
    updated_at: "2026-05-31T12:04:00Z",
  },
];

const mockIncidentDetails: Record<string, IncidentDetail> = {
  inc_prototype_001: {
    incident: mockIncidents[0],
    streams: [
      {
        id: "str_audio_001",
        incident_id: "inc_prototype_001",
        media_type: "audio",
        status: "open",
        chunk_count: 3,
        byte_size: 61440,
        started_at: "2026-06-01T01:00:00Z",
        created_at: "2026-06-01T01:00:00Z",
      },
    ],
    chunks: [
      {
        id: "chk_audio_001",
        incident_id: "inc_prototype_001",
        stream_id: "str_audio_001",
        chunk_index: 1,
        media_type: "audio",
        started_at: "2026-06-01T01:00:00Z",
        ended_at: "2026-06-01T01:00:10Z",
        byte_size: 20480,
        sha256_hex:
          "4f1ef7673557c98ec30a1e83d75f6a5b4796e08f4b2f470582d8d91f73c4bb5d",
        created_at: "2026-06-01T01:00:11Z",
      },
    ],
    checkins: [],
  },
  inc_prototype_002: {
    incident: mockIncidents[1],
    streams: [
      {
        id: "str_metadata_001",
        incident_id: "inc_prototype_002",
        media_type: "metadata",
        status: "complete",
        chunk_count: 1,
        byte_size: 4096,
        started_at: "2026-05-31T11:20:00Z",
        completed_at: "2026-05-31T11:21:00Z",
        created_at: "2026-05-31T11:20:00Z",
      },
    ],
    chunks: [],
    checkins: [],
  },
};

const mockContactPublicKeys: ContactPublicKey[] = [
  {
    public_key_id: "cpk_prototype_001",
    owner_account_id: "acct_prototype",
    contact_id: "ctc_prototype_001",
    version: 1,
    display_label: "Verified trusted contact",
    wrapping_algorithm: "age-v1-x25519",
    public_key_fingerprint: "fingerprint-prototype-001",
    key_state: "active",
    created_at: "2026-06-01T00:30:00Z",
    updated_at: "2026-06-01T00:45:00Z",
  },
];

const mockSharingGrants: SharingGrant[] = [
  {
    grant_id: "sgr_prototype_001",
    owner_account_id: "acct_prototype",
    incident_id: "inc_prototype_002",
    stream_id: null,
    recipient_type: "trusted_contact",
    contact_id: "ctc_prototype_001",
    contact_public_key_id: "cpk_prototype_001",
    contact_public_key_version: 1,
    data_class: "metadata_ciphertext",
    grant_state: "active",
    created_at: "2026-05-31T12:00:00Z",
    updated_at: "2026-05-31T12:00:00Z",
    expires_at: "2026-06-08T12:00:00Z",
  },
];

const mockWrappedKeys: WrappedKey[] = [
  {
    wrapped_key_id: "wkey_prototype_001",
    owner_account_id: "acct_prototype",
    incident_id: "inc_prototype_002",
    stream_id: null,
    grant_id: "sgr_prototype_001",
    recipient_type: "trusted_contact",
    contact_id: "ctc_prototype_001",
    contact_public_key_id: "cpk_prototype_001",
    contact_public_key_version: 1,
    media_key_id: "media-key-prototype-001",
    wrapping_algorithm: "age-v1-x25519",
    wrapping_algorithm_version: "1",
    wrapped_key_state: "active",
    created_at: "2026-05-31T12:01:00Z",
    updated_at: "2026-05-31T12:01:00Z",
  },
];

export class ProoflineApiClient {
  readonly baseUrl: string;
  readonly mode: ClientMode;
  private readonly getToken: () => string | null;

  constructor(options: ClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? defaultBaseUrl).replace(/\/+$/, "");
    this.mode = options.mode ?? defaultMode;
    this.getToken = options.getToken ?? (() => null);
  }

  async login(credentials: {
    username: string;
    password: string;
  }): Promise<LoginResponse> {
    if (this.mode === "mock") {
      return {
        session_id: "ses_prototype",
        account: { ...mockAccount, username: credentials.username },
        token: "prototype-session-token",
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };
    }

    return loginResponseSchema.parse(
      await this.request("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    );
  }

  async logout(): Promise<void> {
    if (this.mode === "mock") {
      return;
    }
    await this.request("/v1/auth/logout", { method: "POST" });
  }

  async getCurrentAccount(): Promise<Account> {
    if (this.mode === "mock") {
      return mockAccount;
    }
    return (await this.request("/v1/account")) as Account;
  }

  async listOwnedIncidents(): Promise<Incident[]> {
    if (this.mode === "mock") {
      return mockIncidents;
    }

    // TODO: Confirm whether `GET /v1/incidents` will be added to
    // open-proofline/server. Current server docs only confirm create/read by ID.
    const response = incidentListResponseSchema.parse(
      await this.request("/v1/incidents"),
    );
    return response.incidents;
  }

  async readIncident(incidentId: string): Promise<IncidentDetail> {
    if (this.mode === "mock") {
      return (
        mockIncidentDetails[incidentId] ?? mockIncidentDetails.inc_prototype_001
      );
    }
    return incidentDetailSchema.parse(
      await this.request(`/v1/incidents/${encodeURIComponent(incidentId)}`),
    );
  }

  async listContactPublicKeys(): Promise<ContactPublicKey[]> {
    if (this.mode === "mock") {
      return mockContactPublicKeys;
    }
    return contactPublicKeysResponseSchema.parse(
      await this.request("/v1/contact-public-keys"),
    ).contact_public_keys;
  }

  async readContactPublicKey(publicKeyId: string): Promise<ContactPublicKey> {
    if (this.mode === "mock") {
      return mockContactPublicKeys[0];
    }
    return contactPublicKeyResponseSchema.parse(
      await this.request(
        `/v1/contact-public-keys/${encodeURIComponent(publicKeyId)}`,
      ),
    ).contact_public_key;
  }

  async listSharingGrants(incidentId: string): Promise<SharingGrant[]> {
    if (this.mode === "mock") {
      return mockSharingGrants.filter(
        (grant) => grant.incident_id === incidentId,
      );
    }
    return sharingGrantsResponseSchema.parse(
      await this.request(
        `/v1/incidents/${encodeURIComponent(incidentId)}/sharing-grants`,
      ),
    ).sharing_grants;
  }

  async readSharingGrant(grantId: string): Promise<SharingGrant> {
    if (this.mode === "mock") {
      return mockSharingGrants[0];
    }
    return sharingGrantResponseSchema.parse(
      await this.request(`/v1/sharing-grants/${encodeURIComponent(grantId)}`),
    ).sharing_grant;
  }

  async listWrappedKeys(incidentId: string): Promise<WrappedKey[]> {
    if (this.mode === "mock") {
      return mockWrappedKeys.filter(
        (record) => record.incident_id === incidentId,
      );
    }
    return wrappedKeysResponseSchema.parse(
      await this.request(
        `/v1/incidents/${encodeURIComponent(incidentId)}/wrapped-keys`,
      ),
    ).wrapped_keys;
  }

  async readWrappedKey(wrappedKeyId: string): Promise<WrappedKey> {
    if (this.mode === "mock") {
      return mockWrappedKeys[0];
    }
    return wrappedKeyResponseSchema.parse(
      await this.request(
        `/v1/wrapped-keys/${encodeURIComponent(wrappedKeyId)}`,
      ),
    ).wrapped_key;
  }

  private async request(
    path: string,
    init: RequestInit = {},
  ): Promise<unknown> {
    const headers = new Headers(init.headers);
    if (init.body && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    const token = this.getToken();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      throw await apiErrorFromResponse(response);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }
}

export function createProoflineApiClient(
  options?: ClientOptions,
): ProoflineApiClient {
  return new ProoflineApiClient(options);
}
