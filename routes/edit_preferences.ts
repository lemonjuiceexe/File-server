import express, { Request, Response, Router } from "express";

import {ITextEditorPreferences} from "../types";
import {setUsersTextEditorPreferences} from "../database";
import {currentPath, RESPONSE_CODES} from "../server";
import * as colorThemes from "../color_themes.json";

const router: Router = express.Router();

router.post("/editPreferences", async (req: Request, res: Response) => {
	const username: string = JSON.parse(req.cookies.sessionToken).username;
	const colorTheme: string = req.body["color-theme"];
	const textSize: number = parseInt(req.body["text-size"]);

	const preferences: ITextEditorPreferences = {
		// @ts-ignore - allow indexing with [colorTheme]
		textColor: colorThemes[colorTheme].textColor,
		// @ts-ignore
		backgroundColor: colorThemes[colorTheme].backgroundColor,
		textSize: textSize
	}

	const responseCode: number = await setUsersTextEditorPreferences(username, preferences);

	if (responseCode === RESPONSE_CODES.OK) {
		res.redirect(`/tree/${currentPath}`);
		return;
	}
	res.redirect(`/tree/${currentPath}?responseCode=${responseCode}`);
});

export default router;