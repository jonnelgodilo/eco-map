// app/add-pin/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Upload, MapPin, Camera, X, Check, Globe, Home, PlusCircle, User, LogOut, Navigation } from "lucide-react";
import Link from "next/link";
import dynamic from 'next/dynamic';

// Dynamically import InteractiveMap to avoid SSR issues
const InteractiveMap = dynamic(
  () => import('@/components/InteractiveMap'),
  { 
    ssr: false, // Disable server-side rendering
    loading: () => (
      <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    )
  }
);

export default function AddPinPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [compressing, setCompressing] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("recycling");
  const [otherCategory, setOtherCategory] = useState("");
  const [photoData, setPhotoData] = useState<string>("");
  const [displayOption, setDisplayOption] = useState<"email" | "anonymous">("email");
  const [location, setLocation] = useState({ lat: 14.5995, lng: 120.9842 }); // Default Manila
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // Auto-detect current location on page load - ONLY on client side
  useEffect(() => {
    // Check if we're on the client before calling detectCurrentLocation
    if (typeof window !== 'undefined') {
      detectCurrentLocation();
    }
  }, []);

  const detectCurrentLocation = () => {
    // Early return if not on client
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError("Location detection requires browser support.");
      setLocationLoading(false);
      return;
    }
    
    setLocationLoading(true);
    setLocationError("");
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setLocationLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationLoading(false);
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location access denied. Please enable location services.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out.");
            break;
          default:
            setLocationError("Unable to get your location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Simple compression function using Canvas
const compressImageWithCanvas = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }
        
        // Calculate new dimensions (maintain aspect ratio)
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1200; // Max width or height
        
        if (width > height && width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image with new dimensions
        ctx.drawImage(img, 0, 0, width, height);
        
        // Check file type and set appropriate compression
        let quality = 0.7; // 70% quality for JPEG
        let mimeType = 'image/jpeg';
        
        if (file.type === 'image/png') {
          mimeType = 'image/png';
          quality = 0.8; // Slightly higher quality for PNG
        } else if (file.type === 'image/webp') {
          mimeType = 'image/webp';
        }
        
        // Convert to base64 with compression
        const compressedBase64 = canvas.toDataURL(mimeType, quality);
        resolve(compressedBase64);
      };
      
      img.onerror = () => reject(new Error("Failed to load image"));
    };
    
    reader.onerror = () => reject(new Error("Failed to read file"));
  });
};

  const handleLogout = async () => {
    // Check if we're on client before using window.confirm
    if (typeof window !== 'undefined' && window.confirm("Are you sure you want to logout?")) {
      try {
        await auth.signOut();
        router.push("/login");
      } catch (error) {
        console.error("Logout error:", error);
        alert("Failed to logout. Please try again.");
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Check file type
  if (!file.type.startsWith("image/")) {
    alert("Please upload an image file (JPEG, PNG, etc.)");
    return;
  }

  setCompressing(true);

  try {
    // If file is larger than 500KB, compress it
    if (file.size > 500 * 1024) {
      console.log(`Original size: ${(file.size / 1024).toFixed(2)}KB`);
      
      const compressedBase64 = await compressImageWithCanvas(file);
      
      // Check the compressed size (base64 is about 33% larger than binary)
      const base64Size = (compressedBase64.length * 3) / 4; // Approximate binary size
      console.log(`Compressed size: ${(base64Size / 1024).toFixed(2)}KB`);
      
      if (base64Size > 550 * 1024) {
        alert("Image compression failed to reduce size enough. Please select a smaller image.");
        return;
      }
      
      setPhotoData(compressedBase64);
      
      // Show success message for large files
      if (file.size > 1024 * 1024) { // If original was > 1MB
        const originalMB = (file.size / 1024 / 1024).toFixed(1);
        const compressedKB = (base64Size / 1024).toFixed(1);
        alert(`✓ Image compressed from ${originalMB}MB to ${compressedKB}KB`);
      }
    } else {
      // For small files (<500KB), use original
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setPhotoData(base64);
      };
      reader.readAsDataURL(file);
    }
  } catch (error) {
    console.error("Error processing image:", error);
    alert("Failed to process image. Please try again.");
  } finally {
    setCompressing(false);
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Please login first");
      return;
    }

    if (!photoData) {
      setError("Please upload a photo");
      return;
    }

    // If category is "other" and no otherCategory specified
    if (category === "other" && !otherCategory.trim()) {
      setError("Please specify the category for 'Other'");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      // Determine final category
      const finalCategory = category === "other" ? otherCategory.trim() : category;
      
      // Determine display name and email
      const displayEmail = displayOption === "anonymous" ? "anonymous" : user.email;
      const displayName = displayOption === "anonymous" ? "Anonymous User" : user.email?.split('@')[0] || "User";
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, "pins"), {
        title,
        description,
        category: finalCategory,
        photoData, // Base64 string
        location,
        userId: user.uid,
        userEmail: displayEmail,
        userName: displayName,
        isAnonymous: displayOption === "anonymous",
        createdAt: new Date().toISOString(),
        likes: 0,
        verified: false
      });

      setSuccess(`Pin added successfully! ${displayOption === "anonymous" ? 'Posted anonymously.' : ''}`);
      
      // Reset form
      setTitle("");
      setDescription("");
      setCategory("recycling");
      setOtherCategory("");
      setPhotoData("");
      setDisplayOption("email");
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);

    } catch (error: any) {
      console.error("Error adding pin:", error);
      setError(`Failed to add pin: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const categories = [
  { value: "recycling", label: "♻️ Recycling Center", color: "bg-green-100 text-green-800" },
  { value: "green_space", label: "🌳 Green Space/Park", color: "bg-emerald-100 text-emerald-800" },
  { value: "transport", label: "🚲 Sustainable Transport", color: "bg-blue-100 text-blue-800" },
  { value: "water", label: "💧 Water Station", color: "bg-cyan-100 text-cyan-800" },
  { value: "pedestrian", label: "🚸 Pedestrian Lane", color: "bg-orange-100 text-orange-800" },
  { value: "waste_segregation", label: "🗑️ Waste Segregation Bins", color: "bg-purple-100 text-purple-800" }, // DITO!
  { value: "other", label: "📍 Other", color: "bg-gray-100 text-gray-800" },
];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar - Same as Dashboard */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center mr-2">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-gray-900">EcoMap</span>
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-md font-medium">
                  SDG 11
                </span>
              </Link>
            </div>

            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-green-600 font-medium flex items-center"
              >
                <Home className="w-4 h-4 mr-1" />
                Dashboard
              </Link>
              <Link
                href="/map"
                className="text-gray-700 hover:text-green-600 font-medium flex items-center"
              >
                <Globe className="w-4 h-4 mr-1" />
                Map
              </Link>
              <Link
                href="/add-pin"
                className="text-gray-700 hover:text-green-600 font-medium flex items-center"
              >
                <PlusCircle className="w-4 h-4 mr-1" />
                Add Pin
              </Link>
              <Link
                href="/profile"
                className="text-gray-700 hover:text-green-600 font-medium flex items-center"
              >
                <User className="w-4 h-4 mr-1" />
                Profile
              </Link>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-700">{user?.email?.split('@')[0] || "User"}</p>
                <p className="text-xs text-gray-500">Adding pin...</p>
              </div>
              
              {/* Profile Avatar */}
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div className="md:hidden bg-white border-t">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-around py-2">
              <Link
                href="/dashboard"
                className="flex flex-col items-center text-gray-700 hover:text-green-600"
              >
                <Home className="w-5 h-5" />
                <span className="text-xs mt-1">Dashboard</span>
              </Link>
              <Link
                href="/map"
                className="flex flex-col items-center text-gray-700 hover:text-green-600"
              >
                <Globe className="w-5 h-5" />
                <span className="text-xs mt-1">Map</span>
              </Link>
              <Link
                href="/add-pin"
                className="flex flex-col items-center text-green-600 font-medium"
              >
                <PlusCircle className="w-5 h-5" />
                <span className="text-xs mt-1">Add Pin</span>
              </Link>
              <Link
                href="/profile"
                className="flex flex-col items-center text-gray-700 hover:text-green-600"
              >
                <User className="w-5 h-5" />
                <span className="text-xs mt-1">Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-4 md:p-6">
          {/* Title */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Pin Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Barangay Recycling Center"
              required
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent h-32"
              placeholder="Describe this location... (What materials are accepted? Opening hours? Special instructions?)"
              required
              maxLength={500}
            />
            <p className="text-sm text-gray-500 mt-1">
              {description.length}/500 characters
            </p>
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Category *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    setCategory(cat.value);
                    if (cat.value !== "other") {
                      setOtherCategory("");
                    }
                  }}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    category === cat.value
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-sm">{cat.label}</div>
                </button>
              ))}
            </div>
            
            {/* Other Category Input */}
            {category === "other" && (
              <div className="mt-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Specify Category *
                </label>
                <input
                  type="text"
                  value={otherCategory}
                  onChange={(e) => setOtherCategory(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Community Garden, Solar Panel Installation, etc."
                  maxLength={50}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Please specify what type of sustainability point this is
                </p>
              </div>
            )}
          </div>

         {/* Photo Upload */}
<div className="mb-6">
  <label className="block text-gray-700 font-medium mb-2">
    Photo *
    <span className="text-sm text-gray-500 font-normal ml-2">
      (Up to 5MB, auto-compressed to ~500KB)
    </span>
  </label>
  
  {!photoData ? (
    <div
      onClick={() => !compressing && fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
        compressing 
          ? "border-gray-300 bg-gray-50 cursor-not-allowed" 
          : "border-gray-300 hover:border-green-400 hover:bg-green-50"
      }`}
    >
      {compressing ? (
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 font-medium">Compressing image...</p>
          <p className="text-sm text-gray-500 mt-1">Please wait</p>
        </div>
      ) : (
        <>
          <Camera className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Click to upload photo</p>
          <p className="text-sm text-gray-500 mt-1">
            JPG, PNG (Up to 5MB, auto-compressed)
          </p>
        </>
      )}
    </div>
  ) : (
    <div className="relative">
      <img
        src={photoData}
        alt="Preview"
        className="w-full h-48 object-cover rounded-lg"
      />
      <button
        type="button"
        onClick={() => setPhotoData("")}
        className="absolute top-3 right-3 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )}
  
  <input
    type="file"
    accept="image/*"
    onChange={handleImageUpload}
    ref={fileInputRef}
    className="hidden"
  />
  
  {/* Compression info tip */}
  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
    <p className="text-sm text-blue-700">
      💡 <span className="font-medium">Automatic Compression:</span> Large images (over 500KB) will be automatically resized and optimized.
    </p>
  </div>
</div>

          {/* Display Option Select */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              How to display your name *
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div 
                onClick={() => setDisplayOption("email")}
                className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${
                  displayOption === "email" 
                    ? "border-green-500 bg-green-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-center">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                    displayOption === "email" 
                      ? "border-green-500 bg-green-500" 
                      : "border-gray-300"
                  }`}>
                    {displayOption === "email" && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="font-medium text-gray-900">Show Email</span>
                </div>
              </div>

              <div 
                onClick={() => setDisplayOption("anonymous")}
                className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${
                  displayOption === "anonymous" 
                    ? "border-green-500 bg-green-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-center">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                    displayOption === "anonymous" 
                      ? "border-green-500 bg-green-500" 
                      : "border-gray-300"
                  }`}>
                    {displayOption === "anonymous" && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="font-medium text-gray-900">Anonymous</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location - Interactive Map */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center text-gray-700 font-medium">
                <MapPin className="w-5 h-5 mr-2" />
                Pinpoint Location *
              </label>
              
              <button
                type="button"
                onClick={detectCurrentLocation}
                disabled={locationLoading}
                className="flex items-center text-sm text-green-600 hover:text-green-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Navigation className="w-4 h-4 mr-1" />
                {locationLoading ? "Detecting..." : "Use My Location"}
              </button>
            </div>
            
            {locationError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{locationError}</p>
              </div>
            )}
            
            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-3">
                Click on the map to mark the exact location. Drag to explore other areas.
              </p>
              
              {locationLoading ? (
                <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
                  <div className="text-center">
                    <Navigation className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-pulse" />
                    <p className="text-gray-500">Detecting your location...</p>
                  </div>
                </div>
              ) : (
                <InteractiveMap
                  initialPosition={location}
                  onLocationSelect={(newLocation) => setLocation(newLocation)}
                  height="300px"
                />
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  value={location.lat}
                  onChange={(e) => {
                    const lat = parseFloat(e.target.value);
                    if (!isNaN(lat)) {
                      setLocation(prev => ({ ...prev, lat }));
                    }
                  }}
                  step="0.000001"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  placeholder="14.5995"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  value={location.lng}
                  onChange={(e) => {
                    const lng = parseFloat(e.target.value);
                    if (!isNaN(lng)) {
                      setLocation(prev => ({ ...prev, lng }));
                    }
                  }}
                  step="0.000001"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  placeholder="120.9842"
                />
              </div>
            </div>
            
            <div className="mt-3 text-xs text-gray-500">
              <p>Current location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !photoData || (category === "other" && !otherCategory.trim())}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Adding Pin...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Check className="w-5 h-5 mr-2" />
                  {displayOption === "anonymous" ? "Add Anonymously" : "Add to Map"}
                </span>
              )}
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700">{success}</p>
              <p className="text-sm text-green-600 mt-2">
                Redirecting to dashboard...
              </p>
            </div>
          )}
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="font-medium text-gray-800 mb-2">💡 How this helps SDG 11</h3>
          <p className="text-sm text-gray-700">
            By adding sustainability pins with exact locations, you're helping to build sustainable cities and communities.
          </p>
        </div>
      </main>
    </div>
  );
}