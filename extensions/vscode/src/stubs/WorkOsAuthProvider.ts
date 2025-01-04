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
import * as path from "node:path";
import * as fs from "fs";

const AUTH_NAME = "Epico-Pilot";

const SESSIONS_SECRET_KEY = `${controlPlaneEnv.AUTH_TYPE}.sessions`;

class UriEventHandler extends EventEmitter<Uri> implements UriHandler {
  public handleUri(uri: Uri) {
    this.fire(uri);
  }
}

import { ControlPlaneSessionInfo } from "core/control-plane/client";
import { controlPlaneEnv } from "core/control-plane/env";

import crypto from "crypto";

import { SecretStorage } from "./SecretStorage";
import { devDataPath } from "core/util/paths";

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
    { promise: Promise<{access_token: string, refresh_token: string}>; cancel: EventEmitter<void> }
  >();
  private _uriHandler = new UriEventHandler();

  private static EXPIRATION_TIME_MS = 1000 * 60 * 15; // 15 minutes

  private secretStorage: SecretStorage;

  private callRefreshTokenTimeout: NodeJS.Timer | null = null;

  constructor(private readonly context: ExtensionContext) {
    this._disposable = Disposable.from(
      authentication.registerAuthenticationProvider(
        controlPlaneEnv.AUTH_TYPE,
        AUTH_NAME,
        this,
        { supportsMultipleAccounts: false },
      ),
      window.registerUriHandler(this._uriHandler),
    );

    this.secretStorage = new SecretStorage(context);
  }

  private decodeJwt(jwt: string): Record<string, any> | null {
    try {
      const decodedToken = JSON.parse(
        Buffer.from(jwt.split(".")[1], "base64").toString(),
      );
      return decodedToken;
    } catch (e: any) {
      console.warn(`Error decoding JWT: ${e}`);
      return null;
    }
  }

  private createExpirationTimeMs(): number {
    return (new Date()).getTime() + 60*60*1000;
  }

  private jwtIsExpiredOrInvalid(jwt: string): boolean {
    const decodedToken = this.decodeJwt(jwt);
    if (!decodedToken) {
      return true;
    }
    return decodedToken.exp * 1000 < Date.now();
  }

  private async debugAccessTokenValidity(jwt: string, refreshToken: string) {
    const expiredOrInvalid = this.jwtIsExpiredOrInvalid(jwt);
    if (expiredOrInvalid) {
      console.debug("Invalid JWT");
    } else {
      console.debug("Valid JWT");
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

    try {
      const value = JSON.parse(data) as ContinueAuthenticationSession[];
      return value;
    } catch (e: any) {
      console.warn(`Error parsing sessions.json: ${e}`);
      return [];
    }
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
    return 'Mindbowser.epico-pilot';
  }

  async refreshSessions() {
    try {
      await this._refreshSessions();
    } catch (e) {
      console.error(`Error refreshing sessions: ${e}`);
    }
  }

  private async _refreshSessions(): Promise<void> {
    let session: ContinueAuthenticationSession | null = null;
    const devDataDir = devDataPath();
    const sessionPath = path.join(devDataDir, "session.jsonl");

    try {
      session = JSON.parse(fs.readFileSync(
        sessionPath,
        "utf8"
      ));
    } catch {
      console.log("Error:", "No session file found!");
    }

    const finalSessions = [];
    if (session) {
      try {
        const newSession = await this._refreshSession(session.refreshToken);
        const finalSession = {
          ...session,
          accessToken: newSession.accessToken,
          refreshToken: newSession.refreshToken,
          expiresInMs: this.createExpirationTimeMs(),
        }
        finalSessions.push(finalSession);
        fs.writeFileSync(
          sessionPath,
          JSON.stringify(finalSession, null, 4),
        );
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
      }

      this._sessionChangeEmitter.fire({
        added: finalSessions,
        removed: [],
        changed: [],
      });
    }
  }

  private async _refreshSession(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresInMs: number;
  }> {
    const response = await fetch("https://api-gateway.epico.ai/m2/v1/access-token", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error("Error refreshing token: " + text);
    }
    const data = (await response.json()) as any;
    
    if (this.callRefreshTokenTimeout) clearInterval(this.callRefreshTokenTimeout);

    this.callRefreshTokenTimeout = setTimeout(
      () => this._refreshSessions(),
      60*1000,
    );

    return {
      accessToken: data?.data?.accessToken,
      refreshToken: data?.data?.refreshToken,
      expiresInMs: this.createExpirationTimeMs(),
    };
  }

  private _formatProfileLabel(
    firstName: string | null,
    lastName: string | null,
  ) {
    return ((firstName ?? "") + " " + (lastName ?? "")).trim();
  }

  /**
   * Create a new auth session
   * @returns
   */
  public async createSession(): Promise<ContinueAuthenticationSession> {
    try {
      const { access_token, refresh_token, name, email } = await this.login();
      if (!access_token && !refresh_token) {
        throw new Error(`Continue login failure`);
      }

      const session: ContinueAuthenticationSession = {
        id: uuidv4(),
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresInMs: this.createExpirationTimeMs(),
        loginNeeded: false,
        account: {
          label: name,
          id: email,
        },
        scopes: [],
      };

      await this.storeSessions([session]);

      this._sessionChangeEmitter.fire({
        added: [session],
        removed: [],
        changed: [],
      });

      const devDataDir = devDataPath();
      const sessionPath = path.join(devDataDir, "session.jsonl");

      // Write the updated suggestions back to the file
      fs.writeFileSync(
        sessionPath,
        JSON.stringify(session, null, 4),
      );

      if (this.callRefreshTokenTimeout) clearInterval(this.callRefreshTokenTimeout);

      this.callRefreshTokenTimeout = setTimeout(
        () => this._refreshSessions(),
        60*1000,
      );

      return session;
    } catch (e) {
      window.showErrorMessage(`Sign in failed: ${e}`);
      throw e;
    }
  }

  public async getSession(): Promise<ContinueAuthenticationSession | null> {
    let session: ContinueAuthenticationSession | null = null;
    const devDataDir = devDataPath();
    const sessionPath = path.join(devDataDir, "session.jsonl");
    try {
      session = JSON.parse(fs.readFileSync(
        sessionPath,
        "utf8"
      ));

      if (this.callRefreshTokenTimeout) clearInterval(this.callRefreshTokenTimeout);

      if (session?.expiresInMs) {
        this.callRefreshTokenTimeout = setTimeout(
          () => this._refreshSessions(),
          session?.expiresInMs - (new Date()).getTime(),
        );
      }
    } catch {
      console.log("Error:", "No session file found!");
    }

    return session;
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
   * Log in to Epico-Pilot
   */
  async login(scopes: string[] = []) {
    return await window.withProgress<{access_token: string, refresh_token: string, name: string, email: string}>(
      {
        location: ProgressLocation.Notification,
        title: "Signing in to Epico-Pilot...",
        cancellable: true,
      },
      async (_, token) => {
        const stateId = uuidv4();

        this._pendingStates.push(stateId);

        const scopeString = scopes.join(" ");

        const url = "https://mindbowser.epico.ai/login";
        const params = {
          redirect_uri: this.redirectUri,
          source: "vscode",
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
              setTimeout(() => reject("Cancelled"), 15 * 60 * 1_000),
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
  ) => PromiseAdapter<Uri, {access_token: string, refresh_token: string, name: string, email: string}> =
    (scopes) => async (uri, resolve, reject) => {
      const query = new URLSearchParams(uri.query);
      const access_token = query.get('accessToken');
      const refresh_token = query.get('refreshToken');
      const name = query.get('name');
      const email = query.get('email');

      if (!access_token) {
        reject(new Error("No access token"));
        return;
      }
      if (!refresh_token) {
        reject(new Error("No refresh state"));
        return;
      }
      if (!email || !name) {
        reject(new Error("No user details"));
        return;
      }

      resolve(({access_token, refresh_token, name, email}));
    };
}

export async function getControlPlaneSessionInfo(
  silent: boolean,
): Promise<ControlPlaneSessionInfo | undefined> {
  const session = await authentication.getSession(
    controlPlaneEnv.AUTH_TYPE,
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
