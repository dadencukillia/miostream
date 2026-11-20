import type { IncomingHttpHeaders } from "node:http";
import * as config from "@config";
import { OAuthConfig, OAuthProvider, providers } from "@utils/oauthProvider";
import { AuthErrors } from "../auth.errors";
import { Pool } from "pg";
import { GoogleOAuthUserInfo } from "../auth.dto";
import * as userServices from "@/api/user/user.shared";
import { UAParser } from "ua-parser-js";
import { SignMetadata } from "./session.service";
import { UserType } from "@/api/user/user.dto";

const REDIRECT_URI = `https://${config.SITE_ADDRESS}/api/auth/callback`;

const oauthProviders: Record<string, { provider: OAuthProvider; config: OAuthConfig }> = {
	google: {
		provider: providers.google,
		config: {
			clientId: config.OAUTH_CLIENT_ID,
			clientSecret: config.OAUTH_CLIENT_SECRET,
			redirectUri: REDIRECT_URI,
			stateSecret: config.OAUTH_STATE_HMAC_SECRET,
			scopes: ["openid", "email", "profile"],
		},
	},
};

function getOAuthProviderEntry(slug: string) {
	const entry = oauthProviders[slug];
	if (!entry) throw AuthErrors.error("oauth-unsupported-provider").withDetails(slug);
	return entry;
}

export function createOAuthAuthorization(providerSlug: string) {
	const entry = getOAuthProviderEntry(providerSlug);
	return entry.provider.getAuthorizationUrl(entry.config);
}

export async function authenticateOAuthCallback(
	client: Pool,
	state: string,
	nonce: string,
	code: string
): Promise<{ userId: string }> {
	const stateVerification = OAuthProvider.verifyState(state, nonce, {
		stateSecret: config.OAUTH_STATE_HMAC_SECRET,
	});
	if (!stateVerification.valid || !stateVerification.provider) {
		throw AuthErrors.error("oauth-invalid-state");
	}

	const entry = getOAuthProviderEntry(stateVerification.provider);

	let profile: GoogleOAuthUserInfo;
	try {
		const providerToken = await entry.provider.exchangeCodeForToken(code, entry.config);
		profile = await entry.provider.getUserInfo<GoogleOAuthUserInfo>(providerToken);
	} catch (e) {
		throw AuthErrors.error("oauth-missing-code").withDetails(e);
	}

	if (!profile.sub || !profile.email || !profile.email_verified) {
		throw AuthErrors.error("oauth-invalid-state").withDetails("unverified or incomplete provider profile");
	}

  let user: UserType|null = null;
  for (let i = 2; i > 0; i--) {
    try {
      user = await userServices.getOrCreateUserByGoogleId(client, {
        googleId: profile.sub,
        email: profile.email,
        fullName: profile.name,
      });
      break;
    } catch(e) {
      if (i === 1) throw e;
    }
  }

  if (!user) throw AuthErrors.error("auth-db-failed");

	if (user.userStatus !== "active") {
		throw AuthErrors.error("auth-no-session-access");
	}

	return { userId: user.userId };
}

export function parseClientMetadata(headers: IncomingHttpHeaders, ipAddress?: string): SignMetadata {
	const parser = new UAParser(headers["user-agent"]);
	const { browser, os, device } = parser.getResult();

	const chModelHeader = headers["sec-ch-ua-model"];
	const chModel = typeof chModelHeader === "string"
		? chModelHeader.replace(/^"|"$/g, "").trim()
		: undefined;

	const deviceModel = chModel || device.model;
	const deviceName = [device.vendor, deviceModel].filter(Boolean).join(" ") || undefined;
	const deviceType = device.type ?? (os.name || browser.name ? "desktop" : undefined);
	const osName = [os.name, os.version].filter(Boolean).join(" ") || undefined;
	const majorVersion = browser.version?.split(".")[0];
	const browserName = [browser.name, majorVersion].filter(Boolean).join(" ") || undefined;

	return {
		deviceType,
		deviceName,
		os: osName,
		browser: browserName,
		ipAddress: ipAddress || undefined,
	};
}
