import express, { Request, Response, Router } from "express";
import * as filesystem from "fs";
import * as filesystemPromises from "fs/promises";
import path from "path";

import { IFiles } from "../types";
import { UPLOAD_DIR, currentPath, setCurrentPath, RESPONSE_CODES } from "../server";

const router: Router = express.Router();

// Folder path relative to the upload directory
async function createFolder(folderPath: string) {
	await filesystemPromises.mkdir(path.join(UPLOAD_DIR, folderPath));
	console.log("🔨 Created folder: " + folderPath);
}

// File path relative to the upload directory
async function createFile(filePath: string): Promise<number> {
	// Check if file already exists
	const fileExists: boolean = await filesystemPromises
		.access(path.join(UPLOAD_DIR, filePath))
		.then(() => true)
		.catch(() => false);

	if (!fileExists) {
		let errorOccured = false;
		await filesystemPromises
			.appendFile(path.join(UPLOAD_DIR, filePath), "")
			.then(() => console.log("🔨 Created file: " + filePath))
			.catch(() => (errorOccured = true));
		if (errorOccured) return RESPONSE_CODES.ERROR;
	}

	return new Promise<number>(resolve => resolve(fileExists ? RESPONSE_CODES.ALREADY_EXISTS : RESPONSE_CODES.OK));
}

router.post("/createFolder", async (req: Request, res: Response): Promise<void> => {
	const folderName: string = req.body.folderName;
	const folderPath: string = path.join(currentPath, folderName);
	await createFolder(folderPath);
	res.redirect("/");
});
router.post("/createFile", async (req: Request, res: Response): Promise<void> => {
	const fileName: string = req.body.fileName;
	const filePath: string = path.join(currentPath, fileName);
	const responseCode: number = await createFile(filePath);
	res.redirect("/");
});
export default router;
