import express, { Request, Response, Router } from "express";
import * as crypto from "crypto-js";

import { addUser, authenticateUser } from "../database";

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
		res.redirect("/login");
		return;
	}
	res.redirect("/register?responseCode=" + responseCode);
});
router.post("/login", async (req: Request, res: Response): Promise<void> => {
	const login: string = req.body.username;
	const password: string = crypto.SHA256(req.body.password).toString();
	const responseCode: number = await authenticateUser(login, password);

	if (responseCode === 0) {
		//TODO: authorisation logic
		res.redirect("/tree");
		return;
	}
	res.redirect("/login?responseCode=" + responseCode);
});

export default router;
