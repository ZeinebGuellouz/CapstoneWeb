import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("presentpro-b7e76-firebase-adminsdk-fbsvc-f540aa32d5.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def clean_created_at():
    users_ref = db.collection("users")
    users = users_ref.stream()

    for user in users:
        user_id = user.id
        presentations_ref = users_ref.document(user_id).collection("presentations")
        presentations = presentations_ref.stream()

        for pres in presentations:
            pres_ref = presentations_ref.document(pres.id)
            data = pres.to_dict()

            if "createdAt" in data and isinstance(data["createdAt"], str):
                print(f"Fixing: {pres.id} for user {user_id}")
                pres_ref.update({"createdAt": firestore.SERVER_TIMESTAMP})

if __name__ == "__main__":
    clean_created_at()
    print("✅ All string-based createdAt fields replaced with Firestore timestamps.")
