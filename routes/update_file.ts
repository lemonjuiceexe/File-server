import express, { Request, Response, Router } from "express";
import * as filesystemPromises from "fs/promises";
import path from "path";
import Jimp from "jimp";

import { UPLOAD_DIR, currentPath, RESPONSE_CODES, IMAGE_EXTENSIONS } from "../server";
import { resourceExists } from "./create_rename_delete";

export const router: Router = express.Router();

export function isTextFile(filePath: string): boolean {
	if (!resourceExists(filePath)) return false;
	return !IMAGE_EXTENSIONS.includes(path.extname(filePath).toLowerCase());
}
async function updateTextFile(filePath: string, fileContent: string): Promise<number> {
	if (isTextFile(filePath)) {
		// Also checks if file exists
		await filesystemPromises
			.writeFile(path.join(UPLOAD_DIR, filePath), fileContent)
			.then(() => console.log("🔨 Saved file: " + filePath))
			.catch(error => {
				console.log("🚨 Failed to save file: " + filePath);
				console.log("Reason: " + error);
				return RESPONSE_CODES.ERROR;
			});
		return RESPONSE_CODES.OK;
	} else {
		return RESPONSE_CODES.NOT_A_TEXT_FILE;
	}
}

async function filterImage(imagePath: string, filterName: string): Promise<number> {
	Jimp.read(path.join(UPLOAD_DIR, imagePath))
		.then((image: Jimp) => {
			switch (filterName) {
				case "blur":
					image.blur(10);
					break;
				case "greyscale":
					image.greyscale();
					break;
				case "sepia":
					image.sepia();
					break;
				default:
					return RESPONSE_CODES.ERROR;
			}
			image.write(path.join(UPLOAD_DIR, imagePath));
		})
		.catch(error => {
			console.log("🚨 Failed to filter image: " + imagePath);
			console.log("Reason: " + error);
		});
	console.log("🖼️ Filtered image: " + imagePath);
	return RESPONSE_CODES.OK;
}

// Text files
router.post("/updateFile", async (req: Request, res: Response): Promise<void> => {
	const filePath: string = req.body.filePath;
	const fileContent: string = req.body.fileContent;
	const responseCode: number = await updateTextFile(filePath, fileContent);

	if (responseCode === RESPONSE_CODES.OK) {
		res.redirect("/tree/" + currentPath);
		return;
	}
	res.redirect(`/tree/${currentPath}?responseCode=${responseCode}`);
});

// Image filtering
router.post("/filterImage", async (req: Request, res: Response): Promise<void> => {
	const filter: string = req.body.filterName;
	const responseCode: number = await filterImage(currentPath, filter);

	if (responseCode === RESPONSE_CODES.OK) {
		res.redirect("/tree/" + currentPath);
		return;
	}
	res.redirect(`/tree/${currentPath}?responseCode=${responseCode}`);
});
