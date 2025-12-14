"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, AlertCircle, Eye, EyeOff, MapPin } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      
      // Login successful!
      console.log("User logged in:", userCredential.user.email);
      
      // CRITICAL: Clear ALL guest session data when logging in properly
      sessionStorage.removeItem("isGuest");
      sessionStorage.removeItem("guestExpiry");
      sessionStorage.removeItem("guestUser");
      sessionStorage.removeItem("guestTimestamp");
      
      localStorage.removeItem("isGuest");
      localStorage.removeItem("guestTimestamp");
      localStorage.removeItem("guestUser");
      
      router.push("/dashboard");
      
    } catch (error: any) {
      console.error("Login error:", error);
      
      // More specific error messages
      if (error.code === "auth/invalid-credential") {
        setError("Invalid email or password. Please try again.");
      } else if (error.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (error.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Guest Access (No Firebase auth needed)
  const handleGuestAccess = async () => {
    setError("");
    setLoading(true);
    
    try {
      // Set guest flags in BOTH sessionStorage and localStorage
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Session storage (cleared when browser closes)
      sessionStorage.setItem("isGuest", "true");
      sessionStorage.setItem("guestExpiry", Date.now().toString());
      sessionStorage.setItem("guestId", guestId);
      
      // Local storage (for page refresh persistence)
      localStorage.setItem("isGuest", "true");
      localStorage.setItem("guestTimestamp", Date.now().toString());
      localStorage.setItem("guestId", guestId);
      
      console.log("Guest access granted with ID:", guestId);
      
      // Redirect to map
      router.push("/map");
      
    } catch (error) {
      console.error("Guest access error:", error);
      setError("Unable to access as guest. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Demo credentials auto-fill
  const fillDemoCredentials = () => {
    setEmail("demo@example.com");
    setPassword("demo123");
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8 mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-4">
            <span className="text-2xl sm:text-3xl text-white">🌍</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Welcome</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Sign in to your Eco-Map account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
          {/* Email Field */}
          <div>
            <label className="flex items-center text-gray-700 mb-2 text-sm sm:text-base">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm sm:text-base"
              placeholder="your@email.com"
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="flex items-center text-gray-700 text-sm sm:text-base">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Password
              </label>
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="text-gray-500 hover:text-gray-700 text-sm flex items-center"
              >
                {showPassword ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-1" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-1" />
                    Show
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-12 text-sm sm:text-base"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <Link 
              href="/forgot-password" 
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white p-3 sm:p-4 rounded-lg font-semibold hover:from-blue-600 hover:to-green-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm sm:text-base">{error}</p>
          </div>
        )}

        {/* Guest Access Button */}
        <button
          onClick={handleGuestAccess}
          disabled={loading}
          className="w-full mt-4 p-3 sm:p-4 border border-green-300 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-all duration-300 flex items-center justify-center text-sm sm:text-base"
        >
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Explore Map as Guest
        </button>

        {/* Signup Link */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-600 text-sm sm:text-base">
            Don't have an account?{" "}
            <Link 
              href="/signup" 
              className="text-green-600 font-semibold hover:text-green-700 hover:underline"
            >
              Sign up here
            </Link>
          </p>
        </div>

        {/* Guest Notice */}
        <div className="mt-6 p-3 sm:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-xs sm:text-sm text-yellow-800 text-center">
            <span className="font-bold">Guest Access:</span> Map view only. No login required. Sign up for full features.
          </p>
        </div>

        {/* Debug Info - Remove in production */}
        <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-500 hidden">
          <p>Debug: Guest session will be cleared on proper login</p>
        </div>
      </div>
    </div>
  );
}