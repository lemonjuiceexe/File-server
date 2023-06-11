import { MongoClient, Db, Collection, ObjectId } from "mongodb";

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
	// Connect to db
	const collection: Collection | null = await connectToUsers();
	if (!collection) return 500;

	// Check if user doesn't already exist
	const userExists: boolean = (await collection.findOne({ username: username })) !== null;
	if (userExists) return 409.1;

	// Add user
	await collection.insertOne({ username: username, password: passwordHash });
	console.log(`👤 User: ${username} registered successfully`);
	return 0;
}
export async function authenticateUser(username: string, passwordHash: string): Promise<number> {
	// Connect to db
	const collection: Collection | null = await connectToUsers();
	if (!collection) return 500;

	// Check if user exists
	const goodCredentials: boolean =
		(await collection.findOne({ username: username, password: passwordHash })) !== null;
	console.log(`🔑 User: ${username}${!goodCredentials ? " not" : ""} authenticated successfully`);
	return goodCredentials ? 0 : 401;
}
