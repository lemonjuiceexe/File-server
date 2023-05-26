import express, {Request, Response, Router} from 'express';
import * as filesystem from "fs";
import * as filesystemPromises from "fs/promises";
import path from 'path';

import { IFiles } from '../types';
import { UPLOAD_DIR, currentPath, setCurrentPath } from "../server";

const router: Router = express.Router();

// Folder path relative to the upload directory
async function createFolder(folderPath: string){
	await filesystemPromises.mkdir(path.join(UPLOAD_DIR, folderPath));
}

router.post('/createFolder', (req: Request, res: Response): void => {
	console.log("cf post");
	const folderName: string = req.body.folderName;
	const folderPath: string = path.join(currentPath, folderName);
	createFolder(folderPath).then(() => {
		res.redirect("/");
	});
});
export default router;