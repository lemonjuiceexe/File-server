export interface IFiles {
	files: string[];
	folders: string[];
}

export interface ISessionToken {
	username: string;
	token: string;
	timestamp: number;
}

export interface ITextFileDefaultContent {
	html: string;
	css: string;
	js: string;
}
