import React, { useState, useRef } from "react";
import { Upload as UploadIcon, FileUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Upload() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for the file input
  const navigate = useNavigate();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
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

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus("Please select a file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadStatus(`File uploaded successfully: ${data.filename}`);
        navigate("/viewer", { state: { slides: data.slides } }); // Pass slides to ShowSlide
      } else {
        setUploadStatus("Failed to upload the file. Please try again.");
      }
    } catch (error) {
      console.error("Error during file upload:", error);
      setUploadStatus("An error occurred. Please try again.");
    }
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click(); // Programmatically trigger file input click
    }
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
              className="hidden" // Hide the file input
              ref={fileInputRef} // Attach the ref
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
              <div className="flex text-sm text-gray-600">
                <button
                  type="button"
                  className="relative cursor-pointer rounded-md font-medium text-primary focus:outline-none"
                  onClick={openFileDialog} // Trigger file input click
                >
                  {file ? file.name : "Upload a file"}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                PPT, PPTX or PDF up to 50MB
              </p>
            </div>
          </div>

          {file && (
            <button
              className="mt-6 w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-light transition-colors duration-200 animate-fade-in"
              onClick={handleUpload}
            >
              Process Presentation
            </button>
          )}
        </div>

        {uploadStatus && (
          <p
            className={`mt-4 text-center ${
              uploadStatus.startsWith("File uploaded")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {uploadStatus}
          </p>
        )}
      </div>
    </div>
  );
}
