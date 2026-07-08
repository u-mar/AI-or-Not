import { MongoClient, type Db } from 'mongodb';

const uri = process.env.DATABASE_URL ?? '';

if (!uri) {
  throw new Error('DATABASE_URL is not configured.');
}

let clientPromise: Promise<MongoClient> | undefined;

function getClientPromise() {
  if (!clientPromise) {
    const client = new MongoClient(uri);
    clientPromise = client.connect();
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db();
}
