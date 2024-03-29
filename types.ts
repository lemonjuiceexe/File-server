export interface IFiles {
	files: string[];
	folders: string[];
}

export interface ISessionToken {
	username: string;
	token: string;
	timestamp: number;
}

export interface ITextEditorPreferences {
	backgroundColor: string;
	textColor: string;
	textSize: number;
}
