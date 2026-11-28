import { Type } from "typebox";
import { ErrorResponse } from "@lib/errorsCollection";
import { UserResponse } from "@/api/user/user.schema";

export const TAG_AUTH = "Auth";

// Provider slug is encoded as the state prefix; '_' is the separator.
export const OAUTH_PROVIDER_PATTERN = "^[a-z][a-z0-9-]*$";

// Requests

export const RegisterRequestPayload = Type.Object({
	email: Type.String({
		format: "email",
		maxLength: 255,
		description: "Unique primary contact email address (uniqueness is case-insensitive)",
		examples: ["john.doe@example.com"],
	}),
	nickname: Type.String({
		minLength: 3,
		maxLength: 30,
		pattern: "^[a-zA-Z0-9_]+$",
		description: "Unique nickname (3-30 characters, Latin letters, digits, and underscores only; reserved words and UUID formats are forbidden). Uniqueness is case-insensitive",
		examples: ["streamer_pro"],
	}),
	fullName: Type.String({
		minLength: 2,
		maxLength: 100,
		pattern: "^[\\p{L}]([\\p{L} '\\u2019\\u02BC.-]*[\\p{L}.])?$",
		description: "Full name or public display name (2-100 characters; Unicode letters, spaces, apostrophes, dots, and hyphens only; must start with a letter)",
		examples: ["John Doe"],
	}),
	password: Type.String({
		minLength: 8,
		maxLength: 72,
		description: "Account password (8 to 72 characters)",
		examples: ["Str0ngP@ssw0rd!"],
	}),
}, {
	additionalProperties: false,
	description: "Payload for registering a new user with email and password",
});

export const LoginRequestPayload = Type.Object({
	identifier: Type.String({
		minLength: 3,
		maxLength: 255,
		description: "User email address or unique nickname (case-insensitive)",
		examples: ["john.doe@example.com", "streamer_pro"],
	}),
	password: Type.String({
		minLength: 8,
		maxLength: 72,
		description: "Account password (8 to 72 characters)",
		examples: ["Str0ngP@ssw0rd!"],
	}),
}, {
	additionalProperties: false,
	description: "Payload for authenticating with email or nickname and password",
});

export const UpdatePasswordRequestPayload = Type.Object({
	oldPassword: Type.String({
		minLength: 8,
		maxLength: 72,
		description: "Current account password",
		examples: ["OldP@ssw0rd123"],
	}),
	newPassword: Type.String({
		minLength: 8,
		maxLength: 72,
		description: "New account password (8 to 72 characters; must differ from oldPassword)",
		examples: ["NewStrongerP@ssw0rd!"],
	}),
}, {
	additionalProperties: false,
	description: "Payload for changing the authenticated user's password",
});

export const OAuthRedirectRequestQueries = Type.Object({
	provider: Type.String({
		pattern: OAUTH_PROVIDER_PATTERN,
		description: "Provider slug. No per-provider endpoints: it is encoded into the state.",
		examples: ["google"],
	}),
}, {
	additionalProperties: false,
});

export const OAuthCallbackRequestQueries = Type.Object({
	code: Type.Optional(Type.String({
		minLength: 1,
		description: "Authorization code returned by the provider",
	})),
	state: Type.Optional(Type.String({
		minLength: 1,
		description: "Opaque state; its prefix identifies the provider",
		examples: ["google_9f2c..."],
	})),
	error: Type.Optional(Type.String({
		minLength: 1,
		description: "Error code reported by the provider",
	})),
}, {
	additionalProperties: true,
	description: "Single callback for every provider",
});

export const LogoutRequestQueries = Type.Object({
	redirect: Type.Optional(Type.String({ format: "url" })),
});

// Responses

export const AccessTokenResponse = Type.Object({
	ok: Type.Literal(true),
	accessToken: Type.String({ description: "Application access token" }),
	tokenType: Type.Literal("Bearer"),
}, {
	additionalProperties: false,
});

// Route schemas

export const RegisterSchema = {
	tags: [TAG_AUTH],
	summary: "Register user with password",
	description: "Creates a new user account with email, nickname, full name, and password, and starts an authenticated session.",
	body: RegisterRequestPayload,
	response: {
		201: UserResponse,
		400: ErrorResponse,
		409: ErrorResponse,
		500: ErrorResponse,
	},
} as const;

export const UpdatePasswordSchema = {
	tags: [TAG_AUTH],
	summary: "Change account password",
	description: "Updates the password for the currently authenticated user.",
	body: UpdatePasswordRequestPayload,
	response: {
		204: Type.Null({ description: "Password changed successfully" }),
		400: ErrorResponse,
		401: ErrorResponse,
		403: ErrorResponse,
		404: ErrorResponse,
		500: ErrorResponse,
	},
} as const;

export const RedirectToProviderSchema = {
	tags: [TAG_AUTH],
	summary: "Redirect to OAuth provider",
	description: "Generic redirect: the provider is passed as a slug and encoded into the state. No response body.",
	querystring: OAuthRedirectRequestQueries,
	response: { 302: Type.Any(), 400: ErrorResponse, 500: ErrorResponse, 501: ErrorResponse },
} as const;

export const OAuthCallbackSchema = {
	tags: [TAG_AUTH],
	summary: "OAuth provider callback",
	description: "Single callback for all providers; the provider is taken from the state. No response body.",
	querystring: OAuthCallbackRequestQueries,
	response: {
		302: Type.Any(),
		400: ErrorResponse,
		403: ErrorResponse,
		409: ErrorResponse,
		500: ErrorResponse,
		501: ErrorResponse,
	},
} as const;

export const AccessTokenSchema = {
	tags: [TAG_AUTH],
	summary: "Get access token",
	description: "Returns an application access token; the provider is taken from the state. No request payload.",
	response: {
		200: AccessTokenResponse,
		400: ErrorResponse,
		403: ErrorResponse,
		404: ErrorResponse,
		500: ErrorResponse,
		501: ErrorResponse,
	},
} as const;

export const LoginSchema = {
	tags: [TAG_AUTH],
	summary: "Login with password",
	description: "Authenticates a user by email or nickname and password, and starts an authenticated session.",
	body: LoginRequestPayload,
	response: {
		200: UserResponse,
		400: ErrorResponse,
		401: ErrorResponse,
		403: ErrorResponse,
		500: ErrorResponse,
	},
} as const;

export const LogoutSchema = {
	tags: [TAG_AUTH],
	summary: "Logouts from user account",
	querystring: LogoutRequestQueries,
	response: {
		302: Type.Any(),
	},
} as const;
