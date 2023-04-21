// ----Imports----
// Libraries
import express, { Express, Request, Response, Router} from 'express';
import path from 'path';
import { create } from 'express-handlebars';
// Custom
import main from './routes/main';

// ----Variables----
const app: Express = express();
const PORT: number = 3000;

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
// ----Routes----
app.use('/', main);

// ----Server----
app.listen(PORT, () => {
	  console.log(`Server is running on port ${PORT}`);
});