import admin from "firebase-admin";

const getCredential = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return admin.credential.applicationDefault();
  }

  return admin.credential.applicationDefault();
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: getCredential(),
  });
}

export const db = admin.firestore();
