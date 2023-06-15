import { MongoClient, Db, Collection } from "mongodb";

import { ITextEditorPreferences } from "./types";
import { RESPONSE_CODES } from "./server";
import { isNameValid } from "./routes/create_rename_delete";

async function connectToDatabase(databaseName: string): Promise<Db | null> {
	try {
		const client: MongoClient = new MongoClient("mongodb://localhost:27017/");
		await client.connect();
		console.log("🧭 Connected to database: " + databaseName);
		return client.db(databaseName);
	} catch (error) {
		console.log("🚨 Failed to connect to database: " + databaseName);
		console.log("Reason: " + error);
		return null;
	}
}
async function selectCollection(db: Db, collectionName: string): Promise<Collection | null> {
	try {
		const collection: Collection = db.collection(collectionName);
		console.log("🧭 Selected collection: " + collectionName);
		return collection;
	} catch (error) {
		console.log("🚨 Failed to select collection: " + collectionName);
		console.log("Reason: " + error);
		return null;
	}
}
async function connectToUsers(): Promise<Collection | null> {
	const db: Db | null = await connectToDatabase("fileserver");
	if (!db) return null;
	const collection: Collection | null = await selectCollection(db, "users");
	if (!collection) return null;
	return collection;
}

export async function addUser(username: string, passwordHash: string): Promise<number> {
	if (!isNameValid(username)) return RESPONSE_CODES.INVALID_NAME;

	// Connect to db
	const collection: Collection | null = await connectToUsers();
	if (!collection) return RESPONSE_CODES.ERROR;

	// Check if user doesn't already exist
	const userExists: boolean = (await collection.findOne({ username: username })) !== null;
	if (userExists) return RESPONSE_CODES.ALREADY_EXISTS;

	// Add user
	await collection.insertOne({
		username: username,
		password: passwordHash,
		textEditorPreferences: {
			backgroundColor: "#ffffff",
			textColor: "#000000",
			textSize: 16
		}
	});
	console.log(`👤 User: ${username} registered successfully`);
	return RESPONSE_CODES.OK;
}
export async function authenticateUser(username: string, passwordHash: string): Promise<number> {
	// Connect to db
	const collection: Collection | null = await connectToUsers();
	if (!collection) return RESPONSE_CODES.ERROR;

	// Check if user exists
	const goodCredentials: boolean =
		(await collection.findOne({ username: username, password: passwordHash })) !== null;
	console.log(`🔑 User: ${username}${!goodCredentials ? " not" : ""} authenticated successfully`);
	return goodCredentials ? RESPONSE_CODES.OK : RESPONSE_CODES.INVALID_CREDENTIALS;
}

export async function getUsersTextEditorPreferences(username: string): Promise<ITextEditorPreferences | number> {
	const collection: Collection | null = await connectToUsers();
	if (!collection) return RESPONSE_CODES.ERROR;

	const user = await collection.findOne({ username: username });
	if (!user) return RESPONSE_CODES.NOT_FOUND;

	return user.textEditorPreferences;
}
export async function setUsersTextEditorPreferences(
	username: string,
	preferences: ITextEditorPreferences
): Promise<number> {
	const collection: Collection | null = await connectToUsers();
	if (!collection) return RESPONSE_CODES.ERROR;
	if (!(await collection.findOne({ username: username }))) return RESPONSE_CODES.NOT_FOUND;
	await collection.updateOne({ username: username }, { $set: { textEditorPreferences: preferences } });
	console.log(`🎨 User: ${username} theme updated successfully`);
	return RESPONSE_CODES.OK;
}
