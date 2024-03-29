import express, { Request, Response, Router } from "express";
import * as filesystemPromises from "fs/promises";
import formidable from "formidable";
import IncomingForm from "formidable/Formidable";
import path from "path";

import { UPLOAD_DIR, currentPath, RESPONSE_CODES } from "../server";

const router: Router = express.Router();

router.post("/upload", (req: Request, res: Response): void => {
	const form: IncomingForm = formidable({
		multiples: true,
		keepExtensions: true,
		uploadDir: path.join(UPLOAD_DIR, currentPath),
		filename: (originalFilename: string, filename: string): string => {
			return originalFilename + "." + filename.split(".").pop();
		}
	});
	form.parse(req, (err, fields: formidable.Fields, files: formidable.Files): void => {
		const receivedFiles: formidable.File[] = files.files as formidable.File[];
		let errorCode: number = 0;
		// When uploading a single file, even though receivedFiles is cast to an array, the .forEach fails
		// The file, however, is somehow still being uploaded. The empty try-catch is a workaround.
		try {
			receivedFiles.forEach((file: formidable.File): void => {
				try {
					const new_path: string = path.join(currentPath, file.originalFilename!);
					console.log("📡 Uploading file " + file.originalFilename);
				} catch (err) {
					console.log("🚨 Error uploading file " + file.originalFilename);
					console.log(err);
					errorCode = RESPONSE_CODES.ERROR;
				}
			});
		} catch (err) {}
		if (errorCode) res.redirect(`/?responseCode=${errorCode}`);
	});
	res.redirect("/tree/" + currentPath);
});

export default router;
