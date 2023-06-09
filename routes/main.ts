import express, { Request, Response, Router } from "express";
import * as filesystem from "fs";
import * as filesystemPromises from "fs/promises";
import path from "path";

import { IFiles } from "../types";
import { UPLOAD_DIR, currentPath, setCurrentPath } from "../server";

const router: Router = express.Router();

// Folder is a path relative to the upload directory
async function getFiles(folder: string): Promise<IFiles> {
	let fullPath = path.join(UPLOAD_DIR, folder);
	// const fullPath = path.join(__dirname, "../..", UPLOAD_DIR + "/" + folder);
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
	res.redirect("/tree");
});
router.get("/tree((/:path)+)?", (req: Request, res: Response): void => {
	const path: string = req.url.split("/tree/")[1];
	console.log("got path " + path);
	setCurrentPath(path ? path : "");

	// Generate a progressive path
	// ex. for /tree/folder1/folder2, the progressive path is ["/", "/folder1", "/folder1/folder2"]
	const splittedPath: string[] = currentPath.split("/");
	let progressivePath: string[] = [];
	for (let i: number = 0; i < splittedPath.length; i++) {
		progressivePath.push("/" + splittedPath.slice(0, i + 1).join("/"));
	}

	getFiles(currentPath).then((result: IFiles): void => {
		const responseCode: number = req.query.responseCode ? parseFloat(req.query.responseCode as string) : 200;
		res.render("root.hbs", {
			files: result.files,
			folders: result.folders,
			currentPath: currentPath,
			progressivePath: progressivePath,
			statusCode: responseCode === 200 ? undefined : responseCode
		});
	});
});
export default router;
