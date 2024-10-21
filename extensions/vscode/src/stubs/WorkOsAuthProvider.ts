import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import {
  authentication,
  AuthenticationProvider,
  AuthenticationProviderAuthenticationSessionsChangeEvent,
  AuthenticationSession,
  Disposable,
  env,
  EventEmitter,
  ExtensionContext,
  ProgressLocation,
  Uri,
  UriHandler,
  window,
} from "vscode";
import { PromiseAdapter, promiseFromEvent } from "./promiseUtils";

const AUTH_NAME = "Epi-Copilot";
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const APP_URL =
  process.env.CONTROL_PLANE_ENV === "local"
    ? "http://localhost:3000"
    : "http://localhost:3000";
const SESSIONS_SECRET_KEY = `${AUTH_TYPE}.sessions`;

class UriEventHandler extends EventEmitter<Uri> implements UriHandler {
  public handleUri(uri: Uri) {
    this.fire(uri);
  }
}

import {
  CONTROL_PLANE_URL,
  ControlPlaneSessionInfo,
} from "core/control-plane/client";
import crypto from "crypto";
import { AUTH_TYPE } from "../util/constants";
import { SecretStorage } from "./SecretStorage";

// Function to generate a random string of specified length
export function generateRandomString(length: number): string {
  const possibleCharacters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let randomString = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * possibleCharacters.length);
    randomString += possibleCharacters[randomIndex];
  }
  return randomString;
}

// Function to generate a code challenge from the code verifier

export async function generateCodeChallenge(verifier: string) {
  // Create a SHA-256 hash of the verifier
  const hash = crypto.createHash("sha256").update(verifier).digest();

  // Convert the hash to a base64 URL-encoded string
  const base64String = hash
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return base64String;
}

interface ContinueAuthenticationSession extends AuthenticationSession {
  refreshToken: string;
  expiresInMs: number;
  loginNeeded: boolean;
}

export class WorkOsAuthProvider implements AuthenticationProvider, Disposable {
  private _sessionChangeEmitter =
    new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();
  private _disposable: Disposable;
  private _pendingStates: string[] = [];
  private _codeExchangePromises = new Map<
    string,
    { promise: Promise<string>; cancel: EventEmitter<void> }
  >();
  private _uriHandler = new UriEventHandler();

  private static EXPIRATION_TIME_MS = 1000 * 60 * 15; // 15 minutes

  private secretStorage: SecretStorage;

  constructor(private readonly context: ExtensionContext) {
    this._disposable = Disposable.from(
      authentication.registerAuthenticationProvider(
        AUTH_TYPE,
        AUTH_NAME,
        this,
        { supportsMultipleAccounts: false },
      ),
      window.registerUriHandler(this._uriHandler),
    );

    this.secretStorage = new SecretStorage(context);
  }

  private decodeJwt(jwt: string): any {
    const decodedToken = JSON.parse(
      Buffer.from(jwt.split(".")[1], "base64").toString(),
    );
    return decodedToken;
  }

  private getExpirationTimeMs(jwt: string): number {
    const decodedToken = this.decodeJwt(jwt);
    return decodedToken.exp && decodedToken.iat
      ? (decodedToken.exp - decodedToken.iat) * 1000
      : WorkOsAuthProvider.EXPIRATION_TIME_MS;
  }

  private jwtIsExpired(jwt: string): boolean {
    const decodedToken = this.decodeJwt(jwt);
    return decodedToken.exp * 1000 < Date.now();
  }

  private async serverThinksAccessTokenIsValid(
    accessToken: string,
  ): Promise<boolean> {
    const url = new URL(CONTROL_PLANE_URL);
    url.pathname = "/hello-secure";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.status === 200;
  }

  private async debugAccessTokenValidity(jwt: string, refreshToken: string) {
    const expired = this.jwtIsExpired(jwt);
    const serverThinksInvalid = await this.serverThinksAccessTokenIsValid(jwt);
    if (expired || serverThinksInvalid) {
      console.debug(`Invalid JWT: ${expired}, ${serverThinksInvalid}`);
    } else {
      console.debug(`Valid JWT: ${expired}, ${serverThinksInvalid}`);
    }
  }

  private async storeSessions(value: ContinueAuthenticationSession[]) {
    const data = JSON.stringify(value, null, 2);
    await this.secretStorage.store(SESSIONS_SECRET_KEY, data);
  }

  public async getSessions(
    scopes?: string[],
  ): Promise<ContinueAuthenticationSession[]> {
    const data = await this.secretStorage.get(SESSIONS_SECRET_KEY);
    if (!data) {
      return [];
    }

    const value = JSON.parse(data) as ContinueAuthenticationSession[];
    return value;
  }

  get onDidChangeSessions() {
    return this._sessionChangeEmitter.event;
  }

  get ideRedirectUri() {
    const publisher = this.context.extension.packageJSON.publisher;
    const name = this.context.extension.packageJSON.name;
    return `${env.uriScheme}://${publisher}.${name}`;
  }

  get redirectUri() {
    if (env.uriScheme === "vscode-insiders" || env.uriScheme === "vscode") {
      // We redirect to a page that says "you can close this page", and that page finishes the redirect
      const url = new URL(APP_URL);
      url.pathname = `/auth/${env.uriScheme}-redirect`;
      return url.toString();
    }
    return this.ideRedirectUri;
  }

  async refreshSessions() {
    await this._refreshSessions();
  }

  private async _refreshSessions(): Promise<void> {
    const sessions = await this.getSessions();
    if (!sessions.length) {
      return;
    }

    const finalSessions = [];
    for (const session of sessions) {
      try {
        const newSession = await this._refreshSession(session.refreshToken);
        finalSessions.push({
          ...session,
          accessToken: newSession.accessToken,
          refreshToken: newSession.refreshToken,
          expiresInMs: newSession.expiresInMs,
        });
      } catch (e: any) {
        // If the refresh token doesn't work, we just drop the session
        console.debug(`Error refreshing session token: ${e.message}`);
        await this.debugAccessTokenValidity(
          session.accessToken,
          session.refreshToken,
        );
        this._sessionChangeEmitter.fire({
          added: [],
          removed: [session],
          changed: [],
        });
        // We don't need to refresh the sessions again, since we'll get a new one when we need it
        // setTimeout(() => this._refreshSessions(), 60 * 1000);
        // return;
      }
    }
    await this.storeSessions(finalSessions);
    this._sessionChangeEmitter.fire({
      added: [],
      removed: [],
      changed: finalSessions,
    });

    if (finalSessions[0]?.expiresInMs) {
      setTimeout(
        async () => {
          await this._refreshSessions();
        },
        (finalSessions[0].expiresInMs * 2) / 3,
      );
    }
  }

  private async _refreshSession(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresInMs: number;
  }> {
    const response = await fetch(new URL("/auth/refresh", CONTROL_PLANE_URL), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken,
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error("Error refreshing token: " + text);
    }
    const data = (await response.json()) as any;
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresInMs: this.getExpirationTimeMs(data.accessToken),
    };
  }

  /**
   * Create a new auth session
   * @param scopes
   * @returns
   */
  public async createSession(
    scopes: string[],
  ): Promise<ContinueAuthenticationSession> {
    try {
      const token = await this.login(scopes);
      if (!token) {
        throw new Error(`Continue login failure`);
      }

      const userInfo = (await this.getUserInfoFromToken(token)) as any;
      const { id_token, access_token, expires_in, ...user } = userInfo;

      const session: ContinueAuthenticationSession = {
        id: uuidv4(),
        accessToken: access_token,
        refreshToken: token,
        expiresInMs: expires_in,
        loginNeeded: false,
        account: {
          label: user.name,
          id: user.email,
        },
        scopes: [],
      };

      await this.storeSessions([session]);

      this._sessionChangeEmitter.fire({
        added: [session],
        removed: [],
        changed: [],
      });

      // TODO: fix _refreshSessions as per google oAuth
      // setTimeout(
      //   () => this._refreshSessions(),
      //   (expires_in * 2) / 3,
      // );

      return session;
    } catch (e) {
      window.showErrorMessage(`Sign in failed: ${e}`);
      throw e;
    }
  }

  /**
   * Remove an existing session
   * @param sessionId
   */
  public async removeSession(sessionId: string): Promise<void> {
    const sessions = await this.getSessions();
    const sessionIdx = sessions.findIndex((s) => s.id === sessionId);
    const session = sessions[sessionIdx];
    sessions.splice(sessionIdx, 1);

    await this.storeSessions(sessions);

    if (session) {
      this._sessionChangeEmitter.fire({
        added: [],
        removed: [session],
        changed: [],
      });
    }
  }

  /**
   * Dispose the registered services
   */
  public async dispose() {
    this._disposable.dispose();
  }

  /**
   * Log in to Epi-Copilot
   */
  async login(scopes: string[] = []) {
    return await window.withProgress<string>(
      {
        location: ProgressLocation.Notification,
        title: "Signing in to Epi-Copilot...",
        cancellable: true,
      },
      async (_, token) => {
        const stateId = uuidv4();

        this._pendingStates.push(stateId);

        const scopeString = scopes.join(" ");

        const url = "https://accounts.google.com/o/oauth2/v2/auth";
        const params = {
          redirect_uri: this.redirectUri,
          client_id: CLIENT_ID,
          response_type: "code",
          prompt: "consent",
          scope: scopeString,
          state: stateId,
        };

        const qs = new URLSearchParams(params);

        await env.openExternal(Uri.parse(`${url}?${qs.toString()}`));

        
        let codeExchangePromise = this._codeExchangePromises.get(scopeString);
        if (!codeExchangePromise) {
          codeExchangePromise = promiseFromEvent(
            this._uriHandler.event,
            this.handleUri(scopes),
          );
          this._codeExchangePromises.set(scopeString, codeExchangePromise);
        }

        try {
          return await Promise.race([
            codeExchangePromise.promise,
            new Promise<string>((_, reject) =>
              setTimeout(() => reject("Cancelled"), 60000),
            ),
            promiseFromEvent<any, any>(
              token.onCancellationRequested,
              (_, __, reject) => {
                reject("User Cancelled");
              },
            ).promise,
          ]);
        } finally {
          this._pendingStates = this._pendingStates.filter(
            (n) => n !== stateId,
          );
          codeExchangePromise?.cancel.fire();
          this._codeExchangePromises.delete(scopeString);
        }
      },
    );
  }

  /**
   * Handle the redirect to VS Code (after sign in from Continue)
   * @param scopes
   * @returns
   */
  private handleUri: (
    scopes: readonly string[],
  ) => PromiseAdapter<Uri, string> =
    (scopes) => async (uri, resolve, reject) => {
      const query = new URLSearchParams(uri.query);
      const access_token = query.get("code");
      const state = query.get("state");

      if (!access_token) {
        reject(new Error("No token"));
        return;
      }
      if (!state) {
        reject(new Error("No state"));
        return;
      }

      // Check if it is a valid auth request started by the extension
      if (!this._pendingStates.some((n) => n === state)) {
        reject(new Error("State not found"));
        return;
      }

      resolve(access_token);
    };

  /**
   * Get the user info from WorkOS
   * @param token
   * @returns
   */
  async getUserInfoFromToken(token: string) {
    try {
      const resp = await fetch(
        "https://oauth2.googleapis.com/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: this.redirectUri,
            grant_type: "authorization_code",
            code: token,
          }),
        },
      );
      const tokenText = await resp.text();
      const { id_token, access_token, expires_in } = await JSON.parse(tokenText);

      const res = await fetch(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${id_token}`,
          },
        }
      );
      const userText = await res.text();
      const user = JSON.parse(userText);

      return { ...user, id_token, access_token, expires_in };
      
    } catch (error: any) {
      console.error(error, "Error fetching Google user");
      throw new Error(error.message);
    }
  }
}

export async function getControlPlaneSessionInfo(
  silent: boolean,
): Promise<ControlPlaneSessionInfo | undefined> {
  const session = await authentication.getSession(
    AUTH_TYPE,
    [],
    silent ? { silent: true } : { createIfNone: true },
  );
  if (!session) {
    return undefined;
  }
  return {
    accessToken: session.accessToken,
    account: {
      id: session.account.id,
      label: session.account.label,
    },
  };
}
