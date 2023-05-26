import express, {Request, Response, Router} from 'express';
import * as filesystem from "fs";
import * as filesystemPromises from "fs/promises";
import path from 'path';

import { IFiles } from '../types';
import { UPLOAD_DIR, currentPath, setCurrentPath } from "../server";

const router: Router = express.Router();


// Folder is a path relative to the upload directory
async function getFiles(folder: string): Promise<IFiles> {
	let fullPath = path.join(UPLOAD_DIR, folder);
	// const fullPath = path.join(__dirname, "../..", UPLOAD_DIR + "/" + folder);
	let files: string[] = [], folders: string[] = [];

	// Get all files and folders in the upload directory
	const filesFound: string[] = await filesystemPromises.readdir(fullPath);

	// Check if file is a folder and push it to either files[] or folders[]
	filesFound.forEach((el: string): void => {
			// Here the fs library must be used instead of fsPromises, as the latter lacks a isDirectory() method
			filesystem.statSync(path.join(fullPath, el))
				.isDirectory() ? folders.push(el) : files.push(el);
		});

	return new Promise<IFiles>(resolve =>
		resolve(
			{
				files: files,
				folders: folders
			})
	);
}

router.get('/', (req: Request, res: Response): void => {
	getFiles(currentPath).then((result: IFiles): void => {
		res.render('root.hbs', {
			files: result.files,
			folders: result.folders,
			currentPath: currentPath,
			currentPathFormatted: currentPath.split("/").filter(el => el.length)
		});
	});
});
export default router;