// app/forgot-password/page.tsx
"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Shield } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (error: any) {
      console.error("Password reset error:", error);
      if (error.code === 'auth/user-not-found') {
        setError("No account found with this email address.");
      } else if (error.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else if (error.code === 'auth/too-many-requests') {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8 mx-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/login"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
          
          <div className="text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Reset Password</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Enter your email to receive a password reset link
            </p>
          </div>
        </div>

        {/* Form or Success Message */}
        {!success ? (
          <form onSubmit={handleResetPassword} className="space-y-5 sm:space-y-6">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white p-3 sm:p-4 rounded-lg font-semibold hover:from-blue-600 hover:to-green-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            {error && (
              <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm sm:text-base">{error}</p>
              </div>
            )}
          </form>
        ) : (
          /* Success Message */
          <div className="text-center py-6 sm:py-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Check Your Email</h2>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              We've sent a password reset link to <strong>{email}</strong>. 
              Please check your inbox and follow the instructions.
            </p>
            
            <div className="space-y-4">
              <Link
                href="/login"
                className="block w-full bg-blue-500 text-white p-3 sm:p-4 rounded-lg font-semibold hover:bg-blue-600 transition-all duration-300 text-sm sm:text-base"
              >
                Return to Login
              </Link>
              
              <button
                onClick={() => {
                  setSuccess(false);
                  setEmail("");
                }}
                className="block w-full border border-gray-300 text-gray-700 p-3 sm:p-4 rounded-lg font-medium hover:bg-gray-50 transition-all duration-300 text-sm sm:text-base"
              >
                Send Another Reset Link
              </button>
            </div>
            
            <div className="mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-700">
                <strong>Note:</strong> The reset link expires in 1 hour. Check your spam folder if you don't see it.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}