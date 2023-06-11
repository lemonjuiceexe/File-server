import express, { Express, Request, Response, Router } from "express";
import { webcrypto } from "crypto";
import { ISessionToken } from "./types";

export const router: Router = express.Router();

// TODO: Make sure that tokens are deleted after this time
export const TOKEN_LIFETIME: number = 1000 * 20; // 20 seconds - debug purposes
let currentSessionTokens: ISessionToken[] = [];

export function generateSessionToken(username: string): string {
	const random: Int32Array = new Int32Array(1);
	webcrypto.getRandomValues(random);
	const token: string = Math.abs(random[0]).toString(32);

	currentSessionTokens.push({
		username: username,
		token: token,
		timestamp: Date.now()
	});

	return token;
}
function verifySessionToken(username: string, token: string): boolean {
	return currentSessionTokens.some((sessionToken: ISessionToken): boolean => {
		// Token exists and is assigned to this user and is not older than TOKEN_LIFETIME
		return (
			sessionToken.token === token &&
			sessionToken.username === username &&
			Date.now() - sessionToken.timestamp <= TOKEN_LIFETIME
		);
	});
}
export function deleteUserSessionTokens(username: string): void {
	currentSessionTokens = currentSessionTokens.filter((token: ISessionToken): boolean => {
		return token.username !== username;
	});
}
export function deleteOldSessionTokens(): void {
	currentSessionTokens = currentSessionTokens.filter((token: ISessionToken): boolean => {
		return Date.now() - token.timestamp <= TOKEN_LIFETIME;
	});
}

router.use((req: Request, res: Response, next: Function): void => {
	//TODO: Consider moving this function somewhere else, right now just deleting old tokens on every single request
	deleteOldSessionTokens();

	// Routes that don't require authentication
	if (["/login", "/register"].includes(req.url.split("?")[0])) {
		next("route");
		return;
	}

	if (!req.cookies.sessionToken) {
		res.redirect("/login?responseCode=401");
		return;
	}
	const sessionCookie: { username: string; token: string } = JSON.parse(req.cookies.sessionToken);
	const goodToken: boolean = verifySessionToken(sessionCookie.username, sessionCookie.token);
	if (!goodToken) {
		res.redirect("/login?responseCode=401");
		return;
	}

	next();
});
