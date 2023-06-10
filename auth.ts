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

export async function addUser(username: string, passwordHash: string): Promise<number> {
	const db: Db | null = await connectToDatabase("fileserver");
	if (!db) return 500;
	const collection: Collection | null = await selectCollection(db, "users");
	if (!collection) return 500;
	console.log("Checking if user exists " + username);
	const userExists: boolean = (await collection.findOne({ username: username })) !== null;
	console.log("User exists: " + userExists);
	if (userExists) return 409.1;

	await collection.insertOne({ username: username, password: passwordHash });
	return 0;
}
