// app/signup/page.tsx
"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, AlertCircle, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      
      setSuccess(`Account created successfully! Welcome ${userCredential.user.email}`);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
      
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please log in instead.");
      } else if (error.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else if (error.code === 'auth/weak-password') {
        setError("Password is too weak. Please choose a stronger password.");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const passwordStrength = () => {
    if (password.length === 0) return { score: 0, label: "", color: "bg-gray-200" };
    if (password.length < 6) return { score: 1, label: "Weak", color: "bg-red-500" };
    if (password.length < 8) return { score: 2, label: "Fair", color: "bg-yellow-500" };
    if (password.length < 10) return { score: 3, label: "Good", color: "bg-green-400" };
    return { score: 4, label: "Strong", color: "bg-green-600" };
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8 mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-4">
            <span className="text-2xl sm:text-3xl text-white">🌱</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Join Eco-Map</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Create your account and join the sustainable community</p>
        </div>
        
        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-5 sm:space-y-6">
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
              className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-sm sm:text-base"
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
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition pr-12 text-sm sm:text-base"
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
            </div>
            
            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Password strength:</span>
                  <span className={`text-xs font-medium ${
                    strength.score === 1 ? "text-red-500" :
                    strength.score === 2 ? "text-yellow-500" :
                    strength.score === 3 ? "text-green-400" :
                    "text-green-600"
                  }`}>
                    {strength.label}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${(strength.score / 4) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          
          {/* Confirm Password Field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="flex items-center text-gray-700 text-sm sm:text-base">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Confirm Password
              </label>
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="text-gray-500 hover:text-gray-700 text-sm flex items-center"
              >
                {showConfirmPassword ? (
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
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition pr-12 text-sm sm:text-base"
                placeholder="Confirm your password"
                required
              />
            </div>
            
            {/* Password Match Indicator */}
            {confirmPassword.length > 0 && (
              <div className="mt-2 flex items-center">
                {password === confirmPassword ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-xs text-green-600">Passwords match</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                    <span className="text-xs text-red-600">Passwords don't match</span>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Create Account Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white p-3 sm:p-4 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
        
        {/* Error Message */}
        {error && (
          <div className="mt-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm sm:text-base">{error}</p>
          </div>
        )}
        
        {/* Success Message */}
        {success && (
          <div className="mt-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-700 text-sm sm:text-base">{success}</p>
              <p className="text-green-600 text-xs sm:text-sm mt-2">
                Redirecting to dashboard...
              </p>
            </div>
          </div>
        )}
        
        {/* Login Link */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-600 text-sm sm:text-base">
            Already have an account?{" "}
            <Link 
              href="/login" 
              className="text-green-600 font-semibold hover:text-green-700 hover:underline"
            >
              Log in here
            </Link>
          </p>
        </div>
        
        {/* SDG Info */}
        <div className="mt-8 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-100">
          <p className="text-xs sm:text-sm text-gray-700 text-center">
            <span className="font-bold">SDG 11:</span> Supporting Sustainable Cities and Communities
          </p>
        </div>
      </div>
    </div>
  );
}