import express, { Request, Response, Router } from "express";
import * as crypto from "crypto-js";

import { createFolder } from "./create_rename_delete";
import { addUser, authenticateUser } from "../database";
import { generateSessionToken, deleteUserSessionTokens, TOKEN_LIFETIME } from "../auth";

const router: Router = express.Router();

router.get("/register", (req: Request, res: Response): void => {
	const responseCode: number = req.query.responseCode ? parseFloat(req.query.responseCode as string) : 0;
	res.render("login_register.hbs", {
		action: "register",
		responseCode: responseCode ? responseCode : undefined
	});
});
router.get("/login", (req: Request, res: Response): void => {
	const responseCode: number = req.query.responseCode ? parseFloat(req.query.responseCode as string) : 0;
	res.render("login_register.hbs", {
		action: "login",
		responseCode: responseCode ? responseCode : undefined
	});
});

// Auth
router.post("/register", async (req: Request, res: Response): Promise<void> => {
	const login: string = req.body.username;
	const password: string = crypto.SHA256(req.body.password).toString();
	const responseCode: number = await addUser(login, password);

	if (responseCode === 0) {
		// Create directory for user
		await createFolder(login);
		res.redirect("/login");
		return;
	}
	res.redirect("/register?responseCode=" + responseCode);
});
router.post("/login", async (req: Request, res: Response): Promise<void> => {
	const username: string = req.body.username;
	const password: string = crypto.SHA256(req.body.password).toString();
	const responseCode: number = await authenticateUser(username, password);

	if (responseCode === 0) {
		// Remove old session tokens for this user
		// - https://developer.mozilla.org/en-US/docs/Web/Security/Types_of_attacks#session_fixation
		deleteUserSessionTokens(username);
		// Generate and set new session token
		const token: string = generateSessionToken(username);
		res.cookie(
			"sessionToken",
			JSON.stringify({
				username: username,
				token: token
			}),
			{
				maxAge: TOKEN_LIFETIME,
				httpOnly: true,
				secure: true
			}
		);

		res.redirect("/tree");
		return;
	}
	res.redirect("/login?responseCode=" + responseCode);
});

export default router;
