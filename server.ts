// ----Imports----
// Libraries
import express, { Express, Request, Response, Router } from "express";
import { create } from "express-handlebars";
import path from "path";
// import bodyParser from 'body-parser';
// Custom
import mainRouter from "./routes/main";
import createRouter from "./routes/create_delete";

// ----Variables----
const app: Express = express();
const PORT: number = 3000;
export const UPLOAD_DIR: string = path.join(__dirname, "../", "upload");
export let currentPath: string = "/superfolder";
export const RESPONSE_CODES = {
	OK: 200,
	ALREADY_EXISTS: 409,
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
		extname: ".hbs"
	}).engine
);
app.set("view engine", "hbs");
app.set("views", "./views");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ----Routes----
app.use("/", mainRouter);
app.use("/", createRouter);

// ----Server----
app.listen(PORT, () => {
	console.log(`🎈 Server is running on port ${PORT}`);
});
