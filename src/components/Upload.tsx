import { useState, useRef, useEffect } from "react";
import { Upload as UploadIcon, FileUp } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { uploadFile } from "../api"; // ✅ Import API function
import LoginModal from "./ui/LoginModal"; // ✅ Import Login Modal

interface UploadProps {
  user: string | null;  // ✅ Add user prop
  setUser: (user: string | null) => void;
}

export function Upload({ user, setUser }: UploadProps) {// ✅ Use user from props
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Login Function
  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Invalid username or password.");
        return;
      }

      // ✅ Update user session
      localStorage.setItem("authenticatedUser", username);
      setUser(username); // ✅ Update user state in App.tsx
      setShowLoginModal(false);
      alert(`Login successful! Welcome, ${username}.`);
    } catch (error) {
      console.error("Login error:", error);
      alert("Failed to login. Please try again.");
    }
  };



  useEffect(() => {
    if (location.state?.scrollToUpload) {
      setTimeout(() => {
        const uploadSection = document.getElementById("upload");
        if (uploadSection) {
          uploadSection.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  }, [location.state]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // ✅ Upload File Function
  const handleUpload = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!file) {
      setUploadStatus("Please select a file before uploading.");
      return;
    }

    try {
      const data = await uploadFile(file);
      setUploadStatus(`File uploaded successfully: ${data.filename}`);
      navigate("/viewer", { state: { slides: data.slides } });
    } catch (error) {
      console.error("Error during file upload:", error);
      setUploadStatus("Failed to upload the file. Please try again.");
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div id="upload" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center animate-fade-in">
          <h2 className="text-3xl font-extrabold text-primary sm:text-4xl">
            Upload Your Presentation
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Drag and drop your presentation file or click to browse
          </p>
        </div>

        <div className="mt-12 max-w-lg mx-auto animate-scale-in">
          <div
            className={`relative rounded-lg border-2 border-dashed p-12 text-center transition-all duration-200 ${
              dragActive ? "border-primary bg-primary/5" : "border-gray-300"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleChange}
              accept=".ppt,.pptx,.pdf"
            />

            <div className="space-y-4">
              <div className="flex justify-center">
                {file ? (
                  <FileUp className="h-12 w-12 text-primary animate-scale-in" />
                ) : (
                  <UploadIcon className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <button
                type="button"
                className="relative cursor-pointer rounded-md font-medium text-primary focus:outline-none"
                onClick={openFileDialog}
              >
                {file ? file.name : "Upload a file"}
              </button>
              <p className="text-xs text-gray-500">PPT, PPTX or PDF up to 50MB</p>
            </div>
          </div>

          {file && (
            <button className="mt-6 w-full bg-primary text-white py-3 px-4 rounded-md" onClick={handleUpload}>
              Process Presentation
            </button>
          )}
        </div>

        {/* ✅ Show Login Modal when needed */}
        {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />}

        {/* ✅ Show Logout Option */}
        <div className="text-center mt-6">
          {/* ✅ Show Logout Option */}
<div className="text-center mt-6">


  {/* ✅ Show Upload Status Message */}
  {uploadStatus && (
    <p className={`mt-4 text-center ${
      uploadStatus.startsWith("File uploaded") ? "text-green-600" : "text-red-600"
    }`}>
      {uploadStatus}
    </p>
  )}
</div>
     </div>
      </div>
    </div>
  );
}
