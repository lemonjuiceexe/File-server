import express, { Request, Response, Router } from "express";
import * as filesystemPromises from "fs/promises";
import path from "path";

import { UPLOAD_DIR, currentPath, RESPONSE_CODES } from "../server";

const router: Router = express.Router();

// Path relative to the upload directory
function resourceExists(resourcePath: string): Promise<boolean> {
	return filesystemPromises
		.access(path.join(UPLOAD_DIR, resourcePath))
		.then(() => true)
		.catch(() => false);
}

// Folder path relative to the upload directory
async function createFolder(folderPath: string) {
	const folderExists: boolean = await resourceExists(folderPath);
	if (!folderExists) {
		let errorOccured = false;
		await filesystemPromises
			.mkdir(path.join(UPLOAD_DIR, folderPath))
			.then(() => console.log("🔨 Created folder: " + folderPath))
			.catch(() => {
				errorOccured = true;
			});
		if (errorOccured) return RESPONSE_CODES.ERROR;
	}
	return new Promise<number>(resolve => resolve(folderExists ? RESPONSE_CODES.ALREADY_EXISTS : RESPONSE_CODES.OK));
}
// File path relative to the upload directory
async function createFile(filePath: string): Promise<number> {
	// Check if file already exists
	const fileExists: boolean = await resourceExists(filePath);
	if (!fileExists) {
		console.log("File " + filePath + " does not exist");
		let errorOccured = false;
		await filesystemPromises
			.appendFile(path.join(UPLOAD_DIR, filePath), "")
			.then(() => console.log("🔨 Created file: " + filePath))
			.catch(() => {
				errorOccured = true;
			});
		if (errorOccured) return RESPONSE_CODES.ERROR;
	}
	return new Promise<number>(resolve => resolve(fileExists ? RESPONSE_CODES.ALREADY_EXISTS : RESPONSE_CODES.OK));
}

router.post("/createFolder", async (req: Request, res: Response): Promise<void> => {
	const folderName: string = req.body.folderName;
	const folderPath: string = path.join(currentPath, folderName);
	const responseCode: number = await createFolder(folderPath);
	res.redirect(`/?responseCode=${responseCode}`);
});
router.post("/createFile", async (req: Request, res: Response): Promise<void> => {
	const fileName: string = req.body.fileName;
	const filePath: string = path.join(currentPath, fileName);
	const responseCode: number = await createFile(filePath);
	res.status(responseCode).redirect(`/?responseCode=${responseCode}`);
});
export default router;
