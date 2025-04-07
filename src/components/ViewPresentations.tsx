import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaSearch, FaTimes } from "react-icons/fa";

type Presentation = {
  id: string;
  fileName: string;
  createdAt?: {
    _seconds?: number;
  };
  thumbnailUrl?: string;
};

function ViewPresentations() {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredThumbnail, setHoveredThumbnail] = useState<string | null>(null);

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
        toast.error("Error fetching presentations");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    const token = await user.getIdToken();
    try {
      const res = await fetch(`http://127.0.0.1:8000/delete_presentation?presentation_id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setPresentations((prev) => prev.filter((p) => p.id !== id));
        toast.success("Presentation deleted successfully");
      } else {
        toast.error("Failed to delete presentation");
      }
    } catch (err) {
      toast.error("Error deleting presentation");
    }
  };

  const handleBatchDelete = async () => {
    if (!user || selected.size === 0) return;
    const token = await user.getIdToken();
    const ids = Array.from(selected);

    try {
      const res = await fetch("http://127.0.0.1:8000/delete_presentations_batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ presentation_ids: ids }),
      });

      if (res.ok) {
        setPresentations((prev) => prev.filter((p) => !selected.has(p.id)));
        setSelected(new Set());
        toast.success("Batch deletion successful");
      } else {
        toast.error("Failed to delete presentations");
      }
    } catch (err) {
      toast.error("Error deleting presentations");
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected(
      selected.size === filtered.length ? new Set() : new Set(filtered.map((p) => p.id))
    );
  };

  const filtered = presentations.filter((p) =>
    p.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pt-20 px-6 md:px-10 min-h-screen bg-gray-50">
      <div className="flex items-center justify-center gap-2 mb-4 max-w-xl mx-auto">
        <div className="relative w-full">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded shadow-sm"
          />
          {searchTerm && (
            <FaTimes
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
            />
          )}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="text-center mb-4">
          <button
            onClick={handleBatchDelete}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
          >
            Delete Selected ({selected.size})
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-500">No presentations found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="col-span-full">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.size === filtered.length}
                onChange={toggleSelectAll}
              />
              Select All
            </label>
          </div>

          {filtered.map((presentation) => (
            <div
              key={presentation.id}
              className={`relative bg-white shadow-sm border border-gray-200 rounded-lg p-4 flex flex-col justify-between transition hover:shadow-md ${
                selected.has(presentation.id) ? "ring-2 ring-red-400" : ""
              }`}
            >
              {/* ✅ Real thumbnail with hover preview */}
              <div
                className="relative h-36 rounded overflow-hidden mb-3 border bg-gray-100"
                onMouseEnter={() => setHoveredThumbnail(presentation.thumbnailUrl || null)}
                onMouseLeave={() => setHoveredThumbnail(null)}
              >
                {presentation.thumbnailUrl ? (
                  <img
                    src={presentation.thumbnailUrl}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="flex items-center justify-center h-full text-gray-400 text-sm">
                    No Preview
                  </span>
                )}
              </div>

              <label
                className="cursor-pointer"
                onClick={() => toggleSelect(presentation.id)}
              >
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={selected.has(presentation.id)}
                  onChange={() => toggleSelect(presentation.id)}
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 truncate">
                    {presentation.fileName}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {presentation.createdAt?._seconds
                      ? new Date(presentation.createdAt._seconds * 1000).toLocaleString()
                      : "Upload date unknown"}
                  </p>
                </div>
              </label>

              <div className="flex justify-between mt-4">
                <button
                  onClick={() => navigate(`/viewer?presentationId=${presentation.id}`)}
                  className="bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-md transition"
                >
                  View
                </button>
                <button
                  onClick={() =>
                    window.confirm("Are you sure you want to delete this presentation?")
                      ? handleDelete(presentation.id)
                      : null
                  }
                  className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition"
                >
                  Delete
                </button>
              </div>

              {/* Floating preview on hover */}
              {hoveredThumbnail === presentation.thumbnailUrl && (
                <div className="absolute z-50 top-0 left-full ml-4 w-64 h-auto shadow-lg border rounded bg-white p-2">
                  <img
                    src={presentation.thumbnailUrl || ""}
                    alt="Thumbnail preview"
                    className="w-full h-auto rounded"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ViewPresentations;
