import * as React from "react";
import { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react"; 
import { 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth, googleProvider, facebookProvider } from "../firebase/firebaseConfig";


interface LoginModalProps {
  onClose: () => void;
  onLogin: (email: string) => void; 
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [loading, setLoading] = useState(false);  // ✅ Prevent multiple logins



  const handleOAuthLogin = async (provider: GoogleAuthProvider | FacebookAuthProvider) => {
    if (loading) return; // Prevent duplicate requests
    setLoading(true);  // Start loading state
  
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
  
      const response = await fetch("http://127.0.0.1:8000/oauth-login", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      const data = await response.json();
      if (!response.ok) throw new Error("OAuth login failed");
  
      localStorage.setItem("authenticatedUser", data.email);
      onLogin(data.email); 
      onClose(); 
    } catch (error) {
      console.error("OAuth Error:", error);
      setError("OAuth login failed. Please try again.");
    } finally {
      setLoading(false);  // Reset loading state
    }
  };
  
  // ✅ Firebase Email/Password Signup
  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      localStorage.setItem("authenticatedUser", user.email!);
      onLogin(user.email!);
      onClose();
    } catch (error: any) {
      console.error("Signup Error:", error);
      setError(error.message || "Signup failed. Try again.");
    }
  };

  // ✅ Firebase Email/Password Login
  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      localStorage.setItem("authenticatedUser", user.email!);
      onLogin(user.email!);
      onClose();
    } catch (error: any) {
      console.error("Login Error:", error);
      setError("Invalid email or password.");
    }
  };

  // ✅ Forgot Password Function
  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage("A password reset email has been sent to your inbox!");
      setError("");
    } catch (error: any) {
      console.error("Password reset error:", error);
      setError("Failed to send reset email. Check your email address.");
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96 relative animate-fade-in">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-600 hover:text-gray-800">
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 text-center">
          {isSignup ? "Sign Up" : "Log In"}
        </h2>

        {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
        {resetMessage && <p className="text-green-500 text-sm mt-2 text-center">{resetMessage}</p>}

        <div className="mt-4 space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-md focus:ring focus:ring-primary focus:outline-none"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-md focus:ring focus:ring-primary focus:outline-none pr-10"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-500">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {isSignup && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 border rounded-md focus:ring focus:ring-primary focus:outline-none"
            />
          )}
        </div>

        {!isSignup && (
          <p className="text-sm text-blue-600 cursor-pointer mt-2 text-center" onClick={handleForgotPassword}>
            Forgot Password?
          </p>
        )}

        <div className="mt-6 flex flex-col space-y-3">
          <button onClick={isSignup ? handleSignup : handleLogin} className="bg-primary text-white px-4 py-2 rounded-md w-full">
            {isSignup ? "Sign Up" : "Log In"}
          </button>

          <button onClick={() => handleOAuthLogin(googleProvider)} className="bg-red-500 text-white px-4 py-2 rounded-md w-full flex items-center justify-center">
            <img src="https://img.icons8.com/color/20/google-logo.png" alt="Google" className="mr-2" />
            Continue with Google
          </button>

          <button onClick={() => handleOAuthLogin(facebookProvider)} className="bg-blue-600 text-white px-4 py-2 rounded-md w-full flex items-center justify-center">
            <img src="https://img.icons8.com/ios-filled/20/ffffff/facebook.png" alt="Facebook" className="mr-2" />
            Continue with Facebook
          </button>
        </div>

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
