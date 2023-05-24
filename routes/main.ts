import express, {Request, Response, Router} from 'express';
import * as filesystem from "fs";
import * as filesystemPromises from "fs/promises";
import path from 'path';

import { IFiles } from '../types';

const router: Router = express.Router();

const UPLOAD_DIR: string = "upload";

async function getFiles(): Promise<IFiles> {
	let files: string[] = [], folders: string[] = [];

	// Get all files and folders in the upload directory
	const filesFound: string[] = await filesystemPromises.readdir(path.join(__dirname, "../..", UPLOAD_DIR));

	// Check if file is a folder and push it to either files[] or folders[]
	filesFound.forEach((el: string): void => {
			// Here the fs library must be used instead of fsPromises, as the latter lacks a isDirectory() method
			filesystem.statSync(path.join(__dirname, "../..", UPLOAD_DIR, el))
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
	getFiles().then((result: IFiles): void => {
		res.render('root.hbs', {
			files: result.files,
			folders: result.folders
		});
	});
});
export default router;