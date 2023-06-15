import express, {Request, Response, Router} from "express";
import * as filesystem from "fs";
import * as filesystemPromises from "fs/promises";
import path from "path";

import {IFiles, ITextEditorPreferences} from "../types";
import {UPLOAD_DIR, RESPONSE_CODES, IMAGE_FILTERS, currentPath, setCurrentPath, validatePath} from "../server";
import {resourceExists, isFolder} from "./create_rename_delete";
import {isTextFile} from "./update_file";
import {getUsersTextEditorPreferences} from "../database";
import * as colorThemes from "../color_themes.json";
// const colorThemes = cth;

const router: Router = express.Router();

// Folder is a path relative to the upload directory
async function getFiles(folder: string): Promise<IFiles> {
	let fullPath: string = path.join(UPLOAD_DIR, folder);
	let files: string[] = [],
		folders: string[] = [];

	// Get all files and folders in the upload directory
	const filesFound: string[] = await filesystemPromises.readdir(fullPath);

	// Check if file is a folder and push it to either files[] or folders[]
	filesFound.forEach((el: string): void => {
		// Here the fs library must be used instead of fsPromises, as the latter lacks a isDirectory() method
		filesystem.statSync(path.join(fullPath, el)).isDirectory() ? folders.push(el) : files.push(el);
	});

	return new Promise<IFiles>(resolve =>
		resolve({
			files: files,
			folders: folders
		})
	);
}

router.get("/", (req: Request, res: Response): void => {
	res.redirect(`/login`);
});
// Catches all filepaths that start with /tree/
router.get("/tree((/:path)+)?", async (req: Request, res: Response): Promise<void> => {
	// Get the path from the url, validate and set as current path
	const pathReceived: string = validatePath(req.url);
	setCurrentPath(pathReceived ? pathReceived : "");
	// Request contains the cookie - it's already checked by auth.ts
	const username: string = JSON.parse(req.cookies.sessionToken).username;

	// Generate a progressive path
	// ex. for /tree/folder1/folder2, the progressive path is ["/", "/folder1", "/folder1/folder2"]
	const splitPath: string[] = currentPath.split("/").filter((el: string): boolean => el !== "");
	let progressivePath: string[] = [];
	for (let i: number = 0; i < splitPath.length; i++) {
		progressivePath.push("/" + splitPath.slice(0, i + 1).join("/"));
	}
	progressivePath = progressivePath.map((el: string): string => el.replace("//", "/"));
	if (!(await resourceExists(currentPath))) {
		res.redirect(`/tree/${username}?responseCode=${RESPONSE_CODES.NOT_FOUND}`);
		return;
	}

	// Handle files
	if (!(await isFolder(currentPath))) {
		// Text files
		if (isTextFile(currentPath)) {
			// Read file content and render the text editor page
			const fileContent: string = filesystem.readFileSync(path.join(UPLOAD_DIR, currentPath), "utf-8");
			const userPreferences: ITextEditorPreferences | number = await getUsersTextEditorPreferences(username);
			if (typeof userPreferences === "number") {
				res.redirect(`/tree/${username}?responseCode=${userPreferences}`);
				return;
			}
			res.render("text_editor.hbs", {
				filePath: currentPath,
				fileContent: fileContent,
				parentDirectory: path.dirname(currentPath),
				username: username,
				textSize: userPreferences.textSize,
				textColor: userPreferences.textColor,
				backgroundColor: userPreferences.backgroundColor,
				colorThemesNames: Object.keys(colorThemes)
			});
		} else {
			res.render("image_editor.hbs", {
				filePath: currentPath,
				parentDirectory: path.dirname(currentPath),
				imagePath: `/${currentPath.slice(0, currentPath.length - 1)}`,
				filters: IMAGE_FILTERS,
				username: username
			});
		}
		return;
	}

	getFiles(currentPath).then((result: IFiles): void => {
		const responseCode: number = req.query.responseCode ? parseFloat(req.query.responseCode as string) : 200;
		res.render("dashboard.hbs", {
			files: result.files,
			folders: result.folders,
			currentPath: currentPath,
			progressivePath: progressivePath,
			username: username,
			statusCode: responseCode === 200 ? undefined : responseCode
		});
	});
});
export default router;
