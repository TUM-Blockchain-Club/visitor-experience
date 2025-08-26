import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

if (!admin.apps.length) {
  const serviceAccountPath = path.resolve(process.cwd(), '../SECRETS/conference-companion-d4f5a-firebase-adminsdk-fbsvc-c5f5e7dbb1.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Service account key not found at ${serviceAccountPath}. Please ensure the SECRETS directory is at the root of the project.`);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

export { adminAuth, adminDb }; 