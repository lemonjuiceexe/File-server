// ----Imports----
// Libraries
import express, { Express, Request, Response, Router} from 'express';
import path from 'path';
import { create } from 'express-handlebars';
// Custom
import main from './routes/main';
import createFolder from './routes/createFolder';

// ----Variables----
const app: Express = express();
const PORT: number = 3000;
export const UPLOAD_DIR: string = path.join(__dirname, "../", "upload");
export let currentPath: string = "/superfolder";
export function setCurrentPath(value: string):void { currentPath = value; }

// ----Config----
app.engine('hbs', create({
	layoutsDir: 'views/layouts',
	partialsDir: 'views/partials',
	defaultLayout: 'main',
	extname: '.hbs'
}).engine);
app.set('view engine', 'hbs');
app.set('views', './views');
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
// ----Routes----
app.use('/', main);
app.use('/createFolder', createFolder);

// ----Server----
app.listen(PORT, () => {
	  console.log(`Server is running on port ${PORT}`);
});