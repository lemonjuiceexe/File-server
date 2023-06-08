import express, { Request, Response, Router } from "express";
import * as filesystem from "fs";
import * as filesystemPromises from "fs/promises";
import path from "path";

import { IFiles } from "../types";
import { UPLOAD_DIR, currentPath, setCurrentPath } from "../server";

const router: Router = express.Router();
const RESPONSE_CODES = {
	OK: 0,
	ALREADY_EXISTS: 1,
	ERROR: 2
};

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
	console.log("a");
});
export default router;
