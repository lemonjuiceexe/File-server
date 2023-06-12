// ----Imports----
// Libraries
import express, { Express, Request, Response, Router } from "express";
import { create } from "express-handlebars";
import path from "path";
import cookieParser from "cookie-parser";
import nocache from "nocache";
// Custom
import { router as authRouter } from "./auth";
import mainRouter from "./routes/main";
import { router as createDeleteRouter } from "./routes/create_rename_delete";
import uploadRouter from "./routes/upload";
import registerLoginRouter from "./routes/login_register";

// ----Variables----
const app: Express = express();
const PORT: number = 3000;
export const UPLOAD_DIR: string = path.join(__dirname, "../", "upload");
export let currentPath: string = "";
// TODO: rewrite this to enum
export const RESPONSE_CODES = {
	OK: 200,
	UNAUTHENTICATED: 401,
	INVALID_CREDENTIALS: 401.1,
	// In the HTTP standard, the 401 is defined as "Unauthorized", it, however, semantically means "Unauthenticated".
	// The 403 "Forbidden" actually means "Unauthorized".
	UNATHORIZED: 403,
	NOT_FOUND: 404,
	ALREADY_EXISTS: 409.1,
	NOT_EMPTY: 409.2,
	INVALID_NAME: 422,
	ERROR: 500
};

export function setCurrentPath(value: string): void {
	currentPath = value;
}
// Accepts full url, returns path after /tree/
export function validatePath(pathToValidate: string): string {
	if (pathToValidate === "/") return "";
	let validatedPath: string = decodeURIComponent(pathToValidate + "/")
		.split("/tree/")[1] // Path after /tree/
		.split("?")[0] // Don't include query parameters
		.replace(/\/\//g, "/"); // Replace all double slashes with single slashes
	if (validatedPath === "/") validatedPath = "";

	return validatedPath;
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
			// TODO: make this better
			concatenate: (str1: string, str2: string, str3: string): string => {
				return str1 + str2 + str3;
			},
			eq: (a: unknown, b: unknown): boolean => a === b,
			decodeURI: (uri: string): string => decodeURIComponent(uri),
			statusCodeMessage: (statusCode: number): string => {
				switch (statusCode) {
					case RESPONSE_CODES.UNAUTHENTICATED:
						return "You are not logged in or your session has expired. Please log in again.";
					case RESPONSE_CODES.UNATHORIZED:
						return "You are not authorized to access this resource.";
					case RESPONSE_CODES.INVALID_CREDENTIALS:
						return "Invalid username or password.";
					case RESPONSE_CODES.NOT_FOUND:
						return "Resource not found.";
					case RESPONSE_CODES.ALREADY_EXISTS:
						return "Resource already exists.";
					case RESPONSE_CODES.NOT_EMPTY:
						return "Folder is not empty.";
					case RESPONSE_CODES.INVALID_NAME:
						return "This name is not allowed. Please choose a new one.";
					default:
						return "Internal server error occured.";
				}
			},
			folderFromProgressivePath: (progressivePath: string): string => {
				const pathArray: string[] = progressivePath.split("/");
				return pathArray[pathArray.length - 1];
			}
		}
	}).engine
);
app.set("view engine", "hbs");
app.set("views", "./views");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(nocache());

// ----Routes----
app.use("/", authRouter); // Must be first, so every request gets authenticated
app.use("/", mainRouter);
app.use("/", createDeleteRouter);
app.use("/", uploadRouter);
app.use("/", registerLoginRouter);

// ----Server----
app.listen(PORT, () => {
	console.log(`🎈 Server is running on port ${PORT}`);
});
