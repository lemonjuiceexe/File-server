// ----Imports----
// Libraries
import express, { Express, Request, Response, Router } from "express";
import { create } from "express-handlebars";
import path from "path";
// Custom
import mainRouter from "./routes/main";
import createDeleteRouter from "./routes/create_delete";
import uploadRouter from "./routes/upload";

// ----Variables----
const app: Express = express();
const PORT: number = 3000;
export const UPLOAD_DIR: string = path.join(__dirname, "../", "upload");
export let currentPath: string = "";
export const RESPONSE_CODES = {
	OK: 200,
	NOT_FOUND: 404,
	ALREADY_EXISTS: 409.1,
	NOT_EMPTY: 409.2,
	ERROR: 500
};

export function setCurrentPath(value: string): void {
	currentPath = value;
}

// ----Config----
app.engine(
	"hbs",
	create({
		layoutsDir: "views/layouts",
		partialsDir: "views/partials",
		defaultLayout: "main",
		extname: ".hbs",
		helpers: {
			statusCodeMessage: (statusCode: number): string => {
				switch (statusCode) {
					case RESPONSE_CODES.NOT_FOUND:
						return "Resource not found";
					case RESPONSE_CODES.ALREADY_EXISTS:
						return "Resource already exists";
					case RESPONSE_CODES.NOT_EMPTY:
						return "Folder is not empty";
					default:
						return "Internal server error occured";
				}
			},
			folderFromProgressivePath: (progressivePath: string): string => {
				const pathArray: string[] = progressivePath.split("/");
				return pathArray[pathArray.length - 1];
			},
			concatenate: (str1: string, str2: string, str3: string): string => {
				return str1 + str2 + str3;
			}
		}
	}).engine
);
app.set("view engine", "hbs");
app.set("views", "./views");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ----Routes----
app.use("/", mainRouter);
app.use("/", createDeleteRouter);
app.use("/", uploadRouter);

// ----Server----
app.listen(PORT, () => {
	console.log(`🎈 Server is running on port ${PORT}`);
});
