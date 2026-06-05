import {
  accountResponseSchema,
  contactPublicKeyResponseSchema,
  contactPublicKeysResponseSchema,
  incidentDetailSchema,
  incidentsResponseSchema,
  emailVerificationResponseSchema,
  loginResponseSchema,
  registrationAcceptedResponseSchema,
  sharingGrantResponseSchema,
  sharingGrantsResponseSchema,
  webCSRFResponseSchema,
  webLoginResponseSchema,
  wrappedKeyResponseSchema,
  wrappedKeysResponseSchema,
  type AuthMode,
  type Account,
  type ContactPublicKey,
  type EmailVerificationResponse,
  type Incident,
  type IncidentDetail,
  type LoginResponse,
  type RegistrationAcceptedResponse,
  type SharingGrant,
  type WebCSRFResponse,
  type WebLoginResponse,
  type WrappedKey,
} from "./schemas";
import { apiErrorFromResponse } from "./errors";

export type ClientMode = "mock" | "live";

type ClientOptions = {
  baseUrl?: string;
  mode?: ClientMode;
  authMode?: AuthMode;
  getToken?: () => string | null;
};

type RegisterAccountRequest = {
  username: string;
  email: string;
  password: string;
};

type VerifyAccountEmailRequest = {
  token: string;
};

type RequestOptions = {
  includeAuth?: boolean;
  includeCredentials?: boolean;
  retryCSRF?: boolean;
  skipCSRF?: boolean;
};

type WebCSRFState = {
  token: string;
  headerName: string;
};

export class CredentialModeError extends Error {
  readonly code = "mixed_credential_mode";

  constructor(message: string) {
    super(message);
    this.name = "CredentialModeError";
  }
}

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

export function defaultProoflineClientMode(): ClientMode {
  return import.meta.env.VITE_PROOFLINE_API_MODE === "live" ? "live" : "mock";
}

export function defaultProoflineAuthMode(
  mode: ClientMode = defaultProoflineClientMode(),
): AuthMode {
  if (mode !== "live") {
    return "bearer";
  }
  const configured = import.meta.env.VITE_PROOFLINE_AUTH_MODE;
  return configured === "cookie" || configured === "browser-cookie"
    ? "cookie"
    : "bearer";
}

const mockAccount: Account = {
  id: "acct_prototype",
  username: "prototype-user",
  account_state: "active",
  role: "user",
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
};

const mockRegistrationAccepted: RegistrationAcceptedResponse = {
  status: "verification_required",
  message:
    "Prototype mock registration accepted. No account is created and no email is sent.",
};

const mockEmailVerification: EmailVerificationResponse = {
  status: "verified",
};

const mockIncidentOne: Incident = {
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
};

const mockIncidentTwo: Incident = {
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
};

const mockIncidents: Incident[] = [mockIncidentOne, mockIncidentTwo];

const mockIncidentDetailOne: IncidentDetail = {
  incident: mockIncidentOne,
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
};

const mockIncidentDetailTwo: IncidentDetail = {
  incident: mockIncidentTwo,
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
};

const mockIncidentDetails: Record<string, IncidentDetail> = {
  inc_prototype_001: {
    ...mockIncidentDetailOne,
  },
  inc_prototype_002: {
    ...mockIncidentDetailTwo,
  },
};

const mockContactPublicKey: ContactPublicKey = {
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
};

const mockContactPublicKeys: ContactPublicKey[] = [mockContactPublicKey];

const mockSharingGrant: SharingGrant = {
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
};

const mockSharingGrants: SharingGrant[] = [mockSharingGrant];

const mockWrappedKey: WrappedKey = {
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
};

const mockWrappedKeys: WrappedKey[] = [mockWrappedKey];

export class ProoflineApiClient {
  readonly baseUrl: string;
  readonly mode: ClientMode;
  readonly authMode: AuthMode;
  private readonly getToken: () => string | null;
  private webCSRF: WebCSRFState | null = null;

  constructor(options: ClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? defaultBaseUrl).replace(/\/+$/, "");
    this.mode = options.mode ?? defaultProoflineClientMode();
    this.authMode =
      this.mode === "live"
        ? (options.authMode ?? defaultProoflineAuthMode(this.mode))
        : "bearer";
    this.getToken = options.getToken ?? (() => null);
  }

  async login(credentials: {
    username: string;
    password: string;
  }): Promise<LoginResponse | WebLoginResponse> {
    if (this.mode === "mock") {
      return {
        session_id: "ses_prototype",
        account: { ...mockAccount, username: credentials.username },
        token: "prototype-session-token",
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };
    }

    if (this.authMode === "cookie") {
      const response = webLoginResponseSchema.parse(
        await this.request(
          "/v1/auth/web/login",
          {
            method: "POST",
            body: JSON.stringify(credentials),
          },
          { includeAuth: false, includeCredentials: true },
        ),
      );
      await this.refreshWebCSRF();
      return response;
    }

    return loginResponseSchema.parse(
      await this.request(
        "/v1/auth/login",
        {
          method: "POST",
          body: JSON.stringify(credentials),
        },
        { includeAuth: false },
      ),
    );
  }

  async registerAccount(
    request: RegisterAccountRequest,
  ): Promise<RegistrationAcceptedResponse> {
    if (this.mode === "mock") {
      return mockRegistrationAccepted;
    }
    return registrationAcceptedResponseSchema.parse(
      await this.request(
        "/v1/auth/register",
        {
          method: "POST",
          body: JSON.stringify(request),
        },
        { includeAuth: false },
      ),
    );
  }

  async verifyAccountEmail(
    request: VerifyAccountEmailRequest,
  ): Promise<EmailVerificationResponse> {
    if (this.mode === "mock") {
      return mockEmailVerification;
    }
    return emailVerificationResponseSchema.parse(
      await this.request(
        "/v1/auth/email/verify",
        {
          method: "POST",
          body: JSON.stringify(request),
        },
        { includeAuth: false },
      ),
    );
  }

  async logout(): Promise<void> {
    if (this.mode === "mock") {
      return;
    }
    try {
      await this.request(
        this.authMode === "cookie" ? "/v1/auth/web/logout" : "/v1/auth/logout",
        { method: "POST" },
      );
    } finally {
      this.clearAuthenticationState();
    }
  }

  async getCurrentAccount(): Promise<Account> {
    if (this.mode === "mock") {
      return mockAccount;
    }
    return accountResponseSchema.parse(await this.request("/v1/account"))
      .account;
  }

  async listOwnedIncidents(): Promise<Incident[]> {
    if (this.mode === "mock") {
      return mockIncidents;
    }

    return incidentsResponseSchema.parse(await this.request("/v1/incidents"))
      .incidents;
  }

  async readIncident(incidentId: string): Promise<IncidentDetail> {
    if (this.mode === "mock") {
      return mockIncidentDetails[incidentId] ?? mockIncidentDetailOne;
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
      return mockContactPublicKey;
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
      return mockSharingGrant;
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
      return mockWrappedKey;
    }
    return wrappedKeyResponseSchema.parse(
      await this.request(
        `/v1/wrapped-keys/${encodeURIComponent(wrappedKeyId)}`,
      ),
    ).wrapped_key;
  }

  async refreshWebCSRF(): Promise<WebCSRFResponse | null> {
    if (this.mode !== "live" || this.authMode !== "cookie") {
      this.webCSRF = null;
      return null;
    }
    const response = webCSRFResponseSchema.parse(
      await this.request(
        "/v1/auth/web/csrf",
        {},
        { skipCSRF: true, retryCSRF: false },
      ),
    );
    this.webCSRF = {
      token: response.csrf_token,
      headerName: response.header_name ?? "X-CSRF-Token",
    };
    return response;
  }

  clearAuthenticationState(): void {
    this.webCSRF = null;
  }

  private async request(
    path: string,
    init: RequestInit = {},
    options: RequestOptions = {},
  ): Promise<unknown> {
    const headers = new Headers(init.headers);
    if (init.body && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    const includeAuth = options.includeAuth !== false;
    const method = (init.method ?? "GET").toUpperCase();
    const usesCookieAuth =
      this.authMode === "cookie" &&
      (includeAuth || options.includeCredentials === true);

    if (this.authMode === "cookie" && headers.has("authorization")) {
      throw new CredentialModeError(
        "Cookie auth mode cannot send Authorization headers.",
      );
    }

    const token =
      includeAuth && this.authMode === "bearer" ? this.getToken() : null;
    if (includeAuth && this.authMode === "cookie" && this.getToken()) {
      throw new CredentialModeError(
        "Cookie auth mode cannot use a bearer token.",
      );
    }
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    if (
      usesCookieAuth &&
      includeAuth &&
      requiresWebCSRF(method) &&
      !options.skipCSRF
    ) {
      if (!this.webCSRF) {
        await this.refreshWebCSRF();
      }
      if (this.webCSRF) {
        headers.set(this.webCSRF.headerName, this.webCSRF.token);
      }
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
      credentials: usesCookieAuth ? "include" : "omit",
    });

    if (!response.ok) {
      const apiError = await apiErrorFromResponse(response);
      if (
        usesCookieAuth &&
        includeAuth &&
        requiresWebCSRF(method) &&
        !options.skipCSRF &&
        options.retryCSRF !== false &&
        apiError.status === 403 &&
        apiError.code === "csrf_required"
      ) {
        this.webCSRF = null;
        await this.refreshWebCSRF();
        return this.request(path, init, { ...options, retryCSRF: false });
      }
      throw apiError;
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }
}

function requiresWebCSRF(method: string): boolean {
  switch (method) {
    case "GET":
    case "HEAD":
    case "OPTIONS":
      return false;
    default:
      return true;
  }
}

export function createProoflineApiClient(
  options?: ClientOptions,
): ProoflineApiClient {
  return new ProoflineApiClient(options);
}
