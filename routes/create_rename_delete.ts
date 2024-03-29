import express, { Request, Response, Router } from "express";
import * as filesystemPromises from "fs/promises";
import path from "path";

import { UPLOAD_DIR, currentPath, RESPONSE_CODES } from "../server";
import * as tfc from "../default_textfiles_content.json";

const textfileContent = tfc as { [key: string]: string }; // Makes it possible to access the object with a string variable

export const router: Router = express.Router();

// ----Functions----
// Path relative to the upload directory
export function resourceExists(resourcePath: string): Promise<boolean> {
	return filesystemPromises
		.access(path.join(UPLOAD_DIR, resourcePath))
		.then(() => true)
		.catch(() => false);
}
export function isFolder(resourcePath: string): Promise<boolean> {
	return filesystemPromises
		.stat(path.join(UPLOAD_DIR, resourcePath))
		.then(stats => stats.isDirectory())
		.catch(() => false);
}
export function isNameValid(name: string): boolean {
	//TODO: Work on allowing %, maybe # too
	const illegalCharacters: string[] = ["/", "\\", ":", "*", "?", '"', "<", ">", "|", "..", "#", "%"];
	for (const character of illegalCharacters) {
		if (name.includes(character)) return false;
	}
	if (name.endsWith(" ")) return false; // Weird things happen when folder name ends with a space - also no real use for that
	return true;
}

// ----Functions for creating/renaming/deleting----
// Folder path relative to the upload directory
export async function createFolder(folderPath: string): Promise<number> {
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

	const defaultContentExtensions: string[] = Object.keys(textfileContent);
	const fileExtension: string = filePath.split(".")[filePath.split(".").length - 1].toLowerCase();
	if (defaultContentExtensions.includes(fileExtension)) {
		await filesystemPromises
			.writeFile(path.join(UPLOAD_DIR, filePath), textfileContent[fileExtension])
			.then(() => console.log("📝 Wrote default content to file: " + filePath))
			.catch(error => {
				console.log("🚨 Failed to write default content to file: " + filePath);
				console.log("Reason: " + error);
			});
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

async function renameResource(oldPath: string, newName: string): Promise<number> {
	const newPath: string = path.join(path.dirname(oldPath), newName);
	const oldExists: boolean = await resourceExists(oldPath);
	const newExists: boolean = await resourceExists(newPath);
	if (oldExists && !newExists) {
		let errorCode: number = 0;
		await filesystemPromises
			.rename(path.join(UPLOAD_DIR, oldPath), path.join(UPLOAD_DIR, newPath))
			.then(() => console.log("📝 Renamed resource: " + oldPath + " -> " + newPath))
			.catch(error => {
				console.log("🚨 Failed to rename resource: " + oldPath);
				console.log("Reason: " + error);
				errorCode = RESPONSE_CODES.ERROR;
			});
		if (errorCode) return errorCode;
	} else if (newExists) {
		return RESPONSE_CODES.ALREADY_EXISTS;
	} else if (!oldExists) {
		return RESPONSE_CODES.NOT_FOUND;
	}
	return RESPONSE_CODES.OK;
}

// ----Routes----
router.post("/createResource", async (req: Request, res: Response): Promise<void> => {
	if (!isNameValid(req.body.resourceName)) {
		res.redirect(`/tree/${currentPath}?responseCode=${RESPONSE_CODES.INVALID_NAME}`);
		return;
	}
	const resourceType: string = req.body.resourceType;
	const resourcePath: string = path.join(currentPath, req.body.resourceName);
	const responseCode: number =
		resourceType === "folder" ? await createFolder(resourcePath) : await createFile(resourcePath);

	if (responseCode === RESPONSE_CODES.OK) {
		res.redirect("/tree/" + currentPath);
		return;
	}
	res.redirect(`/tree/${currentPath}?responseCode=${responseCode}`);
});
router.post("/renameResource", async (req: Request, res: Response): Promise<void> => {
	if (!isNameValid(req.body.newName) || !isNameValid(req.body.oldName)) {
		res.redirect(`/tree/${currentPath}?responseCode=${RESPONSE_CODES.INVALID_NAME}`);
		return;
	}
	const pathToRename: string = path.join(currentPath, req.body.oldName);
	const responseCode: number = await renameResource(pathToRename, req.body.newName);

	if (responseCode === RESPONSE_CODES.OK) {
		res.redirect("/tree/" + currentPath);
		return;
	}
	res.redirect(`/tree/${currentPath}?responseCode=${responseCode}`);
});
router.post("/deleteResource", async (req: Request, res: Response): Promise<void> => {
	if (!isNameValid(req.body.resourceName)) {
		res.redirect(`/tree/${currentPath}?responseCode=${RESPONSE_CODES.INVALID_NAME}`);
		return;
	}
	const resourceType: string = req.body.resourceType;
	const resourcePath: string = path.join(currentPath, req.body.resourceName);
	const responseCode: number =
		resourceType === "folder" ? await deleteFolder(resourcePath) : await deleteFile(resourcePath);

	if (responseCode === RESPONSE_CODES.OK) {
		res.redirect("/tree/" + currentPath);
		return;
	}
	res.redirect(`/tree/${currentPath}?responseCode=${responseCode}`);
});
