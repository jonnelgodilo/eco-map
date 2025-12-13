// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { MapPin, LogOut, User, Globe, Home, PlusCircle, BarChart3, Calendar, Mail } from "lucide-react";
import Link from "next/link";

interface Pin {
  id: string;
  title: string;
  description: string;
  category: string;
  photoData?: string;
  location: { lat: number; lng: number };
  userEmail: string;
  createdAt: string;
  likes?: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pins, setPins] = useState<Pin[]>([]);
  const [pinsLoading, setPinsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchPins();
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchPins = async () => {
    try {
      const pinsQuery = query(
        collection(db, "pins"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(pinsQuery);
      
      const pinsData: Pin[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        pinsData.push({
          id: doc.id,
          title: data.title || "Untitled",
          description: data.description || "",
          category: data.category || "other",
          photoData: data.photoData,
          location: data.location || { lat: 14.5995, lng: 120.9842 },
          userEmail: data.userEmail || "anonymous",
          createdAt: data.createdAt || new Date().toISOString(),
          likes: data.likes || 0,
        });
      });
      
      setPins(pinsData);
    } catch (error) {
      console.error("Error fetching pins:", error);
    } finally {
      setPinsLoading(false);
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

  // Calculate statistics
  const totalPins = pins.length;
  const recyclingPins = pins.filter(p => p.category === "recycling").length;
  const greenSpacePins = pins.filter(p => p.category === "green_space").length;
  const transportPins = pins.filter(p => p.category === "transport").length;
  const uniqueContributors = Array.from(new Set(pins.map(p => p.userEmail))).length;
  
  // Get user's contributions
  const userPins = pins.filter(p => p.userEmail === user?.email);
  const userContributions = userPins.length;

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
      {/* Navigation Bar - Updated to match other pages */}
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
                <p className="text-xs text-gray-500">{userContributions} contributions</p>
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
                className="flex flex-col items-center text-green-600 font-medium"
              >
                <Home className="w-5 h-5" />
                <span className="text-xs mt-1">Dashboard</span>
              </Link>
              <Link
                href="/map"
                className="flex flex-col items-center text-gray-600 hover:text-green-600"
              >
                <Globe className="w-5 h-5" />
                <span className="text-xs mt-1">Map</span>
              </Link>
              <Link
                href="/add-pin"
                className="flex flex-col items-center text-gray-600 hover:text-green-600"
              >
                <PlusCircle className="w-5 h-5" />
                <span className="text-xs mt-1">Add Pin</span>
              </Link>
              <Link
                href="/profile"
                className="flex flex-col items-center text-gray-600 hover:text-green-600"
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
        {/* Welcome Section - Improved */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.email?.split('@')[0] || "User"}!</h1>
          <p className="text-gray-600 mt-2">
            Track sustainability efforts in your community. Together we build better cities.
          </p>
        </div>

        {/* Stats Grid - Simple with fixed colors */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-md mr-3">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalPins}</p>
                <p className="text-sm text-gray-600">Total Points</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-md mr-3">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{uniqueContributors}</p>
                <p className="text-sm text-gray-600">Contributors</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-50 rounded-md mr-3">
                <span className="text-lg">♻️</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{recyclingPins}</p>
                <p className="text-sm text-gray-600">Recycling</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-50 rounded-md mr-3">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{userContributions}</p>
                <p className="text-sm text-gray-600">Your Pins</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Pins Section - Removed View Map link */}
        <div className="bg-white border rounded-lg mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Community Pins</h2>
          </div>
          
          <div className="p-6">
            {pinsLoading ? (
              <div className="py-12 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-3 text-gray-600">Loading pins...</p>
                </div>
              </div>
            ) : pins.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-900 font-medium">No pins yet</p>
                <p className="text-gray-600 mt-1">Be the first to add a sustainability point!</p>
                <Link
                  href="/add-pin"
                  className="mt-4 inline-block px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-md transition-shadow"
                >
                  Add First Pin
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {pins.slice(0, 5).map((pin) => (
                  <div
                    key={pin.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors cursor-pointer"
                    onClick={() => router.push(`/map`)}
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {pin.photoData && (
                        <div className="sm:w-24 sm:h-24">
                          <img
                            src={pin.photoData}
                            alt={pin.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 mb-1">{pin.title}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium self-start sm:self-auto ${
                            pin.category === 'recycling' ? 'bg-green-100 text-green-800' :
                            pin.category === 'green_space' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {pin.category === 'recycling' ? '♻️ Recycling' :
                             pin.category === 'green_space' ? '🌳 Green Space' :
                             '🚲 Transport'}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{pin.description}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm">
                          <div className="flex items-center text-gray-500 mb-2 sm:mb-0">
                            <Mail className="w-4 h-4 mr-1" />
                            <span>{pin.userEmail}</span>
                          </div>
                          <div className="flex items-center text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{new Date(pin.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {pins.length > 5 && (
                  <div className="pt-4 border-t">
                    <Link
                      href="/map"
                      className="block text-center text-green-600 hover:text-green-700 font-medium py-2"
                    >
                      View all {pins.length} community pins →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown with fixed text colors */}
        <div className="bg-white border rounded-lg mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Category Breakdown</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {/* Recycling */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="font-medium text-gray-900">Recycling Points</span>
                  </div>
                  <span className="font-semibold text-gray-900">{recyclingPins} pins</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${(recyclingPins / Math.max(totalPins, 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Green Spaces */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
                    <span className="font-medium text-gray-900">Green Spaces</span>
                  </div>
                  <span className="font-semibold text-gray-900">{greenSpacePins} pins</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(greenSpacePins / Math.max(totalPins, 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Transport */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="font-medium text-gray-900">Transport</span>
                  </div>
                  <span className="font-semibold text-gray-900">{transportPins} pins</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(transportPins / Math.max(totalPins, 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-md mr-3">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">SDG 11: Sustainable Cities</p>
                  <p className="text-sm text-gray-600">This data supports UN Sustainable Development Goal 11</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Your Recent Contributions */}
        {userContributions > 0 && (
          <div className="bg-white border rounded-lg">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Your Recent Contributions</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userPins.slice(0, 3).map((pin) => (
                  <div
                    key={pin.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors cursor-pointer"
                    onClick={() => router.push(`/map`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{pin.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        pin.category === 'recycling' ? 'bg-green-100 text-green-800' :
                        pin.category === 'green_space' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {pin.category === 'recycling' ? '♻️' :
                         pin.category === 'green_space' ? '🌳' : '🚲'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{pin.description}</p>
                    <div className="text-xs text-gray-500">
                      Added {new Date(pin.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
              
              {userPins.length > 3 && (
                <div className="mt-4 pt-4 border-t">
                  <Link
                    href="/profile"
                    className="text-green-600 hover:text-green-700 font-medium text-sm"
                  >
                    View all your {userPins.length} contributions →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Simple Footer */}
        <div className="mt-8 pt-6 border-t text-center">
          <p className="text-gray-500 text-sm">EcoMap • SDG 11 Community Platform</p>
          <p className="text-gray-400 text-xs mt-1">
            {totalPins} points • {uniqueContributors} contributors • {new Date().getFullYear()}
          </p>
        </div>
      </main>
    </div>
  );
}