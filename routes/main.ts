import express, {Request, Response, Router} from 'express';
import * as filesystem from "fs";
import path from 'path';

const router: Router = express.Router();

const UPLOAD_DIR: string = "upload";

router.get('/', (req: Request, res: Response): void => {
	let files: string[] = [];
	let folders: string[] = [];

	filesystem.readdir(path.join(__dirname, "../..", UPLOAD_DIR), (error, files_found: string[]) => {
		if (error) {
			console.log(error);
			return;
		}

		// Check if file is a folder
		files_found.forEach((el: string): void => {
			filesystem.statSync(path.join(__dirname, "../..", UPLOAD_DIR, el))
				.isDirectory() ? folders.push(el) : files.push(el);
		});

		console.log(files);
		console.log(folders);

		res.render('root.hbs', {
			files: files,
			folders: folders
		});
	});
});
export default router;