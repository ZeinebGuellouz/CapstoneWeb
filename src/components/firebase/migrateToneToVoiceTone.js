import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "../../../backend/presentpro-b7e76-firebase-adminsdk-fbsvc-f540aa32d5.json" assert { type: "json" };


// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = getFirestore();


async function migrateToneFields() {
  const usersSnap = await db.collection("users").get();

  for (const userDoc of usersSnap.docs) {
    const presentationsRef = db.collection("users").doc(userDoc.id).collection("presentations");
    const presentationsSnap = await presentationsRef.get();

    for (const presDoc of presentationsSnap.docs) {
      const slidesRef = presentationsRef.doc(presDoc.id).collection("slides");
      const slidesSnap = await slidesRef.get();

      for (const slideDoc of slidesSnap.docs) {
        const data = slideDoc.data();

        if (data.tone && !data.voice_tone) {
          console.log(`Migrating tone in user: ${userDoc.id}, presentation: ${presDoc.id}, slide: ${slideDoc.id}`);
          
          await slideDoc.ref.update({
            voice_tone: data.tone,
            tone: Firestore.FieldValue.delete(),
          });
        }
      }
    }
  }

  console.log("✅ Migration complete.");
}

migrateToneFields().catch(console.error);
