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
		let errorCode: number = 0;
		await filesystemPromises
			.mkdir(path.join(UPLOAD_DIR, folderPath))
			.then(() => console.log("🔨 Created folder: " + folderPath))
			.catch(error => {
				console.log("🚨 Failed to create folder: " + folderPath);
				console.log("Reason: " + error);
				errorCode = RESPONSE_CODES.ERROR;
			});
		if (errorCode) return errorCode;
	}
	return folderExists ? RESPONSE_CODES.ALREADY_EXISTS : RESPONSE_CODES.OK;
}
// File path relative to the upload directory
async function createFile(filePath: string): Promise<number> {
	// Check if file already exists
	const fileExists: boolean = await resourceExists(filePath);
	if (!fileExists) {
		let errorCode: number = 0;
		await filesystemPromises
			.appendFile(path.join(UPLOAD_DIR, filePath), "")
			.then(() => console.log("🔨 Created file: " + filePath))
			.catch(error => {
				console.log("🚨 Failed to create file: " + filePath);
				console.log("Reason: " + error);
				errorCode = RESPONSE_CODES.ERROR;
			});
		if (errorCode) return errorCode;
	}
	return fileExists ? RESPONSE_CODES.ALREADY_EXISTS : RESPONSE_CODES.OK;
}

async function deleteFolder(folderPath: string): Promise<number> {
	const folderExists: boolean = await resourceExists(folderPath);
	if (folderExists) {
		let errorCode: number = 0;
		await filesystemPromises
			.rmdir(path.join(UPLOAD_DIR, folderPath))
			.then(() => console.log("🗑️ Deleted folder: " + folderPath))
			.catch(error => {
				switch (error.code) {
					case "ENOTEMPTY":
						console.log("🚨 Failed to delete folder: " + folderPath);
						console.log("Reason: Folder is not empty");
						errorCode = RESPONSE_CODES.NOT_EMPTY;
						break;
					default:
						console.log("🚨 Failed to delete folder: " + folderPath);
						console.log("Reason: " + error);
						errorCode = RESPONSE_CODES.ERROR;
						break;
				}
			});
		if (errorCode) return errorCode;
	}
	return folderExists ? RESPONSE_CODES.OK : RESPONSE_CODES.NOT_FOUND;
}
async function deleteFile(filePath: string): Promise<number> {
	const fileExists: boolean = await resourceExists(filePath);
	if (fileExists) {
		let errorCode: number = 0;
		await filesystemPromises
			.unlink(path.join(UPLOAD_DIR, filePath))
			.then(() => console.log("🗑️ Deleted file: " + filePath))
			.catch(error => {
				console.log("🚨 Failed to delete file: " + filePath);
				console.log("Reason: " + error);
				errorCode = RESPONSE_CODES.ERROR;
			});
		if (errorCode) return errorCode;
	}
	return fileExists ? RESPONSE_CODES.OK : RESPONSE_CODES.NOT_FOUND;
}

// ----Routes----
router.post("/createResource", async (req: Request, res: Response): Promise<void> => {
	const resourceType: string = req.body.resourceType;
	const resourcePath: string = path.join(currentPath, req.body.resourceName);
	const responseCode: number =
		resourceType === "folder" ? await createFolder(resourcePath) : await createFile(resourcePath);

	if (responseCode === RESPONSE_CODES.OK) {
		res.redirect("/");
		return;
	}
	res.redirect(`/?responseCode=${responseCode}`);
});
router.post("/deleteResource", async (req: Request, res: Response): Promise<void> => {
	const resourceType: string = req.body.resourceType;
	const resourcePath: string = path.join(currentPath, req.body.resourceName);
	const responseCode: number =
		resourceType === "folder" ? await deleteFolder(resourcePath) : await deleteFile(resourcePath);

	if (responseCode === RESPONSE_CODES.OK) {
		res.redirect("/");
		return;
	}
	res.redirect(`/?responseCode=${responseCode}`);
});

export default router;
