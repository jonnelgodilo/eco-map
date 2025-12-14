// app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { 
  MapPin, LogOut, User, Globe, Home, PlusCircle, Calendar, Mail
} from "lucide-react";
import Link from "next/link";

interface UserPin {
  id: string;
  title: string;
  description: string;
  category: string;
  photoData?: string;
  location: { lat: number; lng: number };
  createdAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userPins, setUserPins] = useState<UserPin[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalPins: 0,
    lastPinDate: null as string | null,
  });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserPins(currentUser.uid);
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchUserPins = async (userId: string) => {
    try {
      const pinsQuery = query(
        collection(db, "pins"),
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(pinsQuery);
      
      const pins: UserPin[] = [];
      let lastDate: string | null = null;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const pinData: UserPin = {
          id: doc.id,
          title: data.title,
          description: data.description,
          category: data.category,
          photoData: data.photoData,
          location: data.location,
          createdAt: data.createdAt,
        };
        
        pins.push(pinData);
        
        // Find latest pin
        if (!lastDate || data.createdAt > lastDate) {
          lastDate = data.createdAt;
        }
      });

      // Sort by newest first
      pins.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setUserPins(pins);
      setStats({
        totalPins: pins.length,
        lastPinDate: lastDate,
      });
    } catch (error) {
      console.error("Error fetching user pins:", error);
    }
  };

  const handleDeletePin = async (pinId: string) => {
    if (!user) return;
    
    setDeletingId(pinId);
    try {
      await deleteDoc(doc(db, "pins", pinId));
      
      // Remove from local state
      setUserPins(prev => prev.filter(pin => pin.id !== pinId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalPins: prev.totalPins - 1,
      }));
      
      alert("Pin deleted successfully!");
    } catch (error) {
      console.error("Error deleting pin:", error);
      alert("Failed to delete pin. Please try again.");
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(null);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      try {
        await signOut(auth);
        router.push("/login");
      } catch (error) {
        console.error("Logout error:", error);
        alert("Failed to logout. Please try again.");
      }
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes("recycling") || categoryLower.includes("♻️")) {
      return "♻️";
    } else if (categoryLower.includes("green") || categoryLower.includes("🌳") || categoryLower.includes("park")) {
      return "🌳";
    } else if (categoryLower.includes("transport") || categoryLower.includes("🚲")) {
      return "🚲";
    } else if (categoryLower.includes("water") || categoryLower.includes("💧")) {
      return "💧";
    } else if (categoryLower.includes("pedestrian") || categoryLower.includes("🚸")) {
      return "🚸";
    } else if (categoryLower.includes("waste") || categoryLower.includes("🗑️") || categoryLower.includes("segregation")) {
      return "🗑️";
    } else if (categoryLower.includes("clean") || categoryLower.includes("🧹")) {
      return "🧹";
    } else {
      return "📍";
    }
  };

  const getCategoryColor = (category: string) => {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes("recycling") || categoryLower.includes("♻️")) {
      return "bg-green-100 text-green-800";
    } else if (categoryLower.includes("green") || categoryLower.includes("🌳") || categoryLower.includes("park")) {
      return "bg-emerald-100 text-emerald-800";
    } else if (categoryLower.includes("transport") || categoryLower.includes("🚲")) {
      return "bg-blue-100 text-blue-800";
    } else if (categoryLower.includes("water") || categoryLower.includes("💧")) {
      return "bg-cyan-100 text-cyan-800";
    } else if (categoryLower.includes("pedestrian") || categoryLower.includes("🚸")) {
      return "bg-orange-100 text-orange-800";
    } else if (categoryLower.includes("waste") || categoryLower.includes("🗑️") || categoryLower.includes("segregation")) {
      return "bg-purple-100 text-purple-800";
    } else if (categoryLower.includes("clean") || categoryLower.includes("🧹")) {
      return "bg-orange-100 text-orange-800";
    } else {
      return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryLabel = (category: string) => {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes("recycling") || categoryLower.includes("♻️")) {
      return "Recycling Center";
    } else if (categoryLower.includes("green") || categoryLower.includes("🌳") || categoryLower.includes("park")) {
      return "Green Space/Park";
    } else if (categoryLower.includes("transport") || categoryLower.includes("🚲")) {
      return "Sustainable Transport";
    } else if (categoryLower.includes("water") || categoryLower.includes("💧")) {
      return "Water Station";
    } else if (categoryLower.includes("pedestrian") || categoryLower.includes("🚸")) {
      return "Pedestrian Lane";
    } else if (categoryLower.includes("waste") || categoryLower.includes("🗑️") || categoryLower.includes("segregation")) {
      return "Waste Segregation Bins";
    } else if (categoryLower.includes("clean") || categoryLower.includes("🧹")) {
      return "Clean-up Area";
    } else {
      // For user-specified categories, return as-is
      return category;
    }
  };

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

            {/* User Info - Simple */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-700">{user?.email?.split('@')[0] || "User"}</p>
                <p className="text-xs text-gray-500">{userPins.length} pins</p>
              </div>
              
              {/* Profile Avatar - Circle shape */}
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
              </div>
              
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
                className="flex flex-col items-center text-gray-700 hover:text-green-600"
              >
                <PlusCircle className="w-5 h-5" />
                <span className="text-xs mt-1">Add</span>
              </Link>
              <Link
                href="/profile"
                className="flex flex-col items-center text-green-600 font-medium"
              >
                <User className="w-5 h-5" />
                <span className="text-xs mt-1">Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        </div>

        {/* Profile Info Card */}
        <div className="bg-white border rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Profile Avatar - Circle inside */}
            <div className="flex flex-col items-center md:items-start">
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-xl font-bold text-gray-900">{user?.email?.split('@')[0] || "User"}</h2>
                <p className="text-gray-600 text-sm">{user?.email}</p>
              </div>
            </div>
            
            {/* Profile Info - Simple version */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Member since</p>
                  <p className="font-medium text-gray-900">
                    {user?.metadata?.creationTime 
                      ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { 
                          month: 'short', 
                          year: 'numeric' 
                        }) 
                      : "Recently"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Contributions</p>
                  <p className="font-medium text-gray-900">{stats.totalPins} pins</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Your Contributions Section */}
        <div className="bg-white border rounded-lg mb-8">
          <div className="px-6 py-4 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Your Contributions</h2>
              <div className="text-sm text-gray-500">
                {userPins.length} pin{userPins.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {userPins.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-900 font-medium">No contributions yet</p>
                <p className="text-gray-600 mt-1">Add your first sustainability point!</p>
                <Link
                  href="/add-pin"
                  className="mt-4 inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add First Pin
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {userPins.map((pin) => (
                  <div
                    key={pin.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row gap-4">
                      {pin.photoData && (
                        <div className="md:w-32 md:h-32">
                          <img
                            src={pin.photoData}
                            alt={pin.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">{pin.title}</h3>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <span className={`px-3 py-1 rounded text-xs font-medium ${getCategoryColor(pin.category)}`}>
                                {getCategoryIcon(pin.category)} {getCategoryLabel(pin.category)}
                              </span>
                              <span className="text-xs text-gray-500 flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(pin.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-2 md:mt-0">
                            <button
                              onClick={() => router.push(`/map`)}
                              className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
                            >
                              View
                            </button>
                            
                            {showDeleteConfirm === pin.id ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDeletePin(pin.id)}
                                  disabled={deletingId === pin.id}
                                  className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                                >
                                  {deletingId === pin.id ? "..." : "Delete"}
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(null)}
                                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg border"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowDeleteConfirm(pin.id)}
                                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{pin.description}</p>
                        
                        <div className="text-xs text-gray-500">
                          Location: {pin.location.lat.toFixed(4)}, {pin.location.lng.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center">
          <p className="text-gray-500 text-sm">EcoMap • SDG 11 Community Platform</p>
          <p className="text-gray-400 text-xs mt-1">
            {stats.totalPins} contributions • {new Date().getFullYear()}
          </p>
        </div>
      </main>
    </div>
  );
}