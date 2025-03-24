import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { useNavigate } from "react-router-dom";

type Presentation = {
  id: string;
  fileName: string;
  createdAt?: {
    _seconds?: number;
  };
};

function ViewPresentations() {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        console.warn("User not logged in.");
        navigate("/login");
        return;
      }

      setUser(firebaseUser);
      const token = await firebaseUser.getIdToken();

      try {
        const res = await fetch("http://127.0.0.1:8000/my_presentations", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch presentations");

        const data = await res.json();
        setPresentations(data);
      } catch (err) {
        console.error("Error fetching presentations:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  return (
    <div className="pt-20 px-10 min-h-screen bg-gray-50">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Your Presentations</h2>

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : presentations.length === 0 ? (
        <p className="text-center text-gray-500">No presentations found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presentations.map((presentation) => (
            <div
              key={presentation.id}
              className="bg-white shadow-md rounded-lg p-6 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-800 truncate">
                  {presentation.fileName}
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                 {presentation.createdAt
                   ? typeof presentation.createdAt === "object" && "seconds" in presentation.createdAt
                   ? new Date((presentation.createdAt as any).seconds * 1000).toLocaleString()
                   : new Date(presentation.createdAt as any).toLocaleString()
                   : "Upload date unknown"}
                </p>

              </div>
              <button
                onClick={() => navigate(`/viewer?presentationId=${presentation.id}`)}
                className="mt-4 bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-md transition"
              >
                View
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ViewPresentations;
