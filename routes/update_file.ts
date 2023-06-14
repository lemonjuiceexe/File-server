import express, { Request, Response, Router } from "express";
import * as filesystemPromises from "fs/promises";
import path from "path";

import { UPLOAD_DIR, currentPath, RESPONSE_CODES, IMAGE_EXTENSIONS } from "../server";
import { resourceExists } from "./create_rename_delete";

const router: Router = express.Router();

function isTextFile(filePath: string): boolean {
	if (!resourceExists(filePath)) return false;
	return !IMAGE_EXTENSIONS.includes(path.extname(filePath));
}
async function updateTextFile(filePath: string, fileContent: string): Promise<number> {
	if (isTextFile(filePath)) {
		// Also checks if file exists
		await filesystemPromises
			.writeFile(path.join(UPLOAD_DIR, filePath), fileContent)
			.then(() => console.log("🔨 Saved file: " + filePath))
			.catch(error => {
				console.log("🚨 Failed to save file: " + filePath);
				console.log("Reason: " + error);
				return RESPONSE_CODES.ERROR;
			});
		return RESPONSE_CODES.OK;
	} else {
		return RESPONSE_CODES.NOT_A_TEXT_FILE;
	}
}

router.post("/updateFile", async (req: Request, res: Response): Promise<void> => {
	const filePath: string = req.body.filePath;
	const fileContent: string = req.body.fileContent;
	const responseCode: number = await updateTextFile(filePath, fileContent);

	if (responseCode === RESPONSE_CODES.OK) {
		res.redirect("/tree/" + currentPath);
		return;
	}
	res.redirect(`/tree/${currentPath}?responseCode=${responseCode}`);
});

export default router;
