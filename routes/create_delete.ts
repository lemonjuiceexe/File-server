import express, { Request, Response, Router } from "express";
import * as filesystemPromises from "fs/promises";
import path from "path";

import { UPLOAD_DIR, currentPath, RESPONSE_CODES } from "../server";

const router: Router = express.Router();

// ----Functions----
// Path relative to the upload directory
function resourceExists(resourcePath: string): Promise<boolean> {
	return filesystemPromises
		.access(path.join(UPLOAD_DIR, resourcePath))
		.then(() => true)
		.catch(() => false);
}

// ----Functions for creating/deleting----
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

async function deleteFolder(folderPath: string): Promise<number> {
	const folderExists: boolean = await resourceExists(folderPath);
	if (folderExists) {
		let errorOccured = false;
		await filesystemPromises
			.rmdir(path.join(UPLOAD_DIR, folderPath))
			.then(() => console.log("🗑️ Deleted folder: " + folderPath))
			.catch(() => {
				errorOccured = true;
			});
		if (errorOccured) return RESPONSE_CODES.ERROR;
	}
	return new Promise<number>(resolve => resolve(folderExists ? RESPONSE_CODES.OK : RESPONSE_CODES.NOT_FOUND));
}
async function deleteFile(filePath: string): Promise<number> {
	const fileExists: boolean = await resourceExists(filePath);
	if (fileExists) {
		let errorOccured = false;
		await filesystemPromises
			.unlink(path.join(UPLOAD_DIR, filePath))
			.then(() => console.log("🗑️ Deleted file: " + filePath))
			.catch(() => {
				errorOccured = true;
			});
		if (errorOccured) return RESPONSE_CODES.ERROR;
	}
	return new Promise<number>(resolve => resolve(fileExists ? RESPONSE_CODES.OK : RESPONSE_CODES.NOT_FOUND));
}
// ----Routes----
router.post("/createResource", async (req: Request, res: Response): Promise<void> => {
	const resourceType: string = req.body.resourceType;
	const resourceName: string = req.body.resourceName;
	const resourcePath: string = path.join(currentPath, resourceName);
	const responseCode: number =
		resourceType === "folder" ? await createFolder(resourcePath) : await createFile(resourcePath);

	if (responseCode === RESPONSE_CODES.OK) {
		res.redirect("/");
		return;
	}
	res.redirect(`/?responseCode=${responseCode}`);
});

export default router;
