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
	console.log('folder created');
}

router.post('/createFolder', async (req: Request, res: Response): Promise<void> => {
	console.log("cf post");
	console.log(req);
	console.log('giga pozdro');
	console.log(req.body);
	const folderName: string = req.body.folderName;
	const folderPath: string = path.join(currentPath, folderName);
	await createFolder(folderPath);
	res.redirect("/");
});
export default router;