import { collection, doc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "./components/firebase/firebaseConfig";

const API_URL = "http://127.0.0.1:8000";

export const uploadFile = async (file: File): Promise<any> => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const userId = user.uid;
  const email = user.email!;
  const token = await user.getIdToken(); // ✅ Get Firebase ID token
  const presentationId = `${Date.now()}_${file.name.replace(/\s/g, "_")}`;

  // Save user and presentation metadata to Firestore
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, { email }, { merge: true });

  const presentationRef = doc(db, "users", userId, "presentations", presentationId);
  await setDoc(presentationRef, {
    fileName: file.name,
    createdAt: Timestamp.now(),
    lastModifiedAt: Timestamp.now(),
  });

  // Prepare file upload
  const formData = new FormData();
  formData.append("file", file);

  // ✅ Include Firebase token in the header
  const response = await fetch(`${API_URL}/upload/`, {
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to upload file to backend");
  }

  const data = await response.json();

  // Save each slide to Firestore
  const slides = data.slides;
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const slideRef = doc(db, "users", userId, "presentations", presentationId, "slides", `${i + 1}`);
    await setDoc(slideRef, {
      text: slide.text,
      image: slide.image,
    });
  }

  return {
    filename: file.name,
    slides,
    presentationId,
  };
};
