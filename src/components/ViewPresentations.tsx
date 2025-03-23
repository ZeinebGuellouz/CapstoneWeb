import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

interface Presentation {
  id: string;
  fileName: string;
  createdAt?: { seconds: number };
}

export default function ViewPresentations() {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPresentations = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const idToken = await user.getIdToken(); // 🔐 get token

      try {
        const response = await fetch("http://127.0.0.1:8000/my_presentations", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch presentations");
        }

        const data = await response.json();
        setPresentations(data);
      } catch (error) {
        console.error("Error fetching presentations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPresentations();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-12">
      <h2 className="text-2xl font-semibold text-center mb-6">
        Your Presentations
      </h2>
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : presentations.length === 0 ? (
        <p className="text-center text-gray-500">No presentations found.</p>
      ) : (
        <ul className="space-y-4">
          {presentations.map((pres) => (
            <li
              key={pres.id}
              className="p-4 border rounded-md shadow-sm flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-lg">{pres.fileName}</p>
                {pres.createdAt && (
                  <p className="text-sm text-gray-500">
                    Uploaded on{" "}
                    {new Date(pres.createdAt.seconds * 1000).toLocaleString()}
                  </p>
                )}
              </div>
              <a
                href={`/viewer?presentationId=${pres.id}`}
                className="text-blue-600 hover:underline text-sm"
              >
                View
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
