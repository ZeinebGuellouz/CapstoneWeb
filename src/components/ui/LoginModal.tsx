import * as React from "react";
import { useState } from "react";
import { X } from "lucide-react"; // ✅ Import close icon

interface LoginModalProps {
  onClose: () => void;
  onLogin: (username: string, password: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }

    try {
      const endpoint = isSignup ? "http://127.0.0.1:8000/signup" : "http://127.0.0.1:8000/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "An error occurred.");
        return;
      }

      if (isSignup) {
        alert("Sign up successful! Please log in.");
        setIsSignup(false);
        return;
      }

      localStorage.setItem("authenticatedUser", username);
      onLogin(username, password);
    } catch (error) {
      console.error("Error:", error);
      setError("Something went wrong. Try again.");
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96 relative animate-fade-in">
        
        {/* ✅ Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 text-center">
          {isSignup ? "Sign Up" : "Log In"}
        </h2>

        {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}

        {/* ✅ Styled Input Fields */}
        <div className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 border rounded-md focus:ring focus:ring-primary focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-md focus:ring focus:ring-primary focus:outline-none"
          />
        </div>

        <div className="mt-6 flex justify-between">
          <button onClick={handleSubmit} className="bg-primary text-white px-4 py-2 rounded-md w-full">
            {isSignup ? "Sign Up" : "Log In"}
          </button>
        </div>

        {/* ✅ Toggle Between Login & Signup */}
        <p className="text-sm text-gray-600 mt-4 text-center">
          {isSignup ? "Already have an account?" : "Don't have an account?"}
          <button onClick={() => setIsSignup(!isSignup)} className="text-primary ml-2 font-semibold">
            {isSignup ? "Log In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
