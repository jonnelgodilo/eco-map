// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  MapPin, 
  Users, 
  Leaf, 
  Globe, 
  Shield, 
  TrendingUp,
  ArrowRight,
  CheckCircle
} from "lucide-react";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      // If user is logged in, redirect to dashboard
      if (currentUser) {
        router.push("/dashboard");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Globe className="w-8 h-8 text-green-500 mr-2" />
              <span className="text-xl font-bold text-gray-800">Eco-Map</span>
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                SDG 11
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-green-600 font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-green-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-600"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4 mr-2" />
            Supporting UN Sustainable Development Goal 11
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Building Sustainable
            <span className="text-green-600"> Cities & Communities</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            A community-powered platform to map, track, and promote sustainability 
            efforts in urban areas. Together, we make cities greener.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 bg-green-500 text-white text-lg font-semibold rounded-xl hover:bg-green-600 transition"
            >
              Join the Movement
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-green-500 text-green-600 text-lg font-semibold rounded-xl hover:bg-green-50 transition"
            >
              Explore the Map
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How Eco-Map Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to contribute to sustainable cities
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl border border-green-100">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <MapPin className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">1. Map Locations</h3>
              <p className="text-gray-600">
                Pin recycling centers, parks, bike lanes, and other sustainability 
                resources on our interactive community map.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border border-blue-100">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">2. Share Knowledge</h3>
              <p className="text-gray-600">
                Upload photos, add descriptions, and share information to help 
                others find and use eco-friendly resources.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-white p-8 rounded-2xl border border-emerald-100">
              <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">3. Track Impact</h3>
              <p className="text-gray-600">
                Monitor community progress, view statistics, and see how your 
                contributions help achieve SDG 11 targets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SDG 11 Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center text-white mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Supporting UN Sustainable Development Goal 11
            </h2>
            <p className="text-xl text-green-100">
              "Make cities and human settlements inclusive, safe, resilient and sustainable"
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-6">
                How Eco-Map Contributes
              </h3>
              <ul className="space-y-4">
                {[
                  "Mapping urban sustainability resources",
                  "Promoting community participation",
                  "Tracking environmental initiatives",
                  "Encouraging sustainable transportation",
                  "Documenting green spaces",
                  "Supporting waste management efforts"
                ].map((item, index) => (
                  <li key={index} className="flex items-center text-green-50">
                    <CheckCircle className="w-5 h-5 mr-3 text-green-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl font-bold text-green-700">11</span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">SDG 11 Targets</h4>
                  <p className="text-gray-600">Sustainable Cities & Communities</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {[
                  "Access to green and public spaces",
                  "Sustainable transport systems",
                  "Participatory urban planning",
                  "Reduced environmental impact",
                  "Improved waste management"
                ].map((target, index) => (
                  <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                    <Leaf className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-700">{target}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Eco-Map helps track progress towards these targets through 
                  community-driven data collection and visualization.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-3xl p-12">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl text-green-100 mb-10 max-w-2xl mx-auto">
              Join hundreds of sustainability champions mapping their communities 
              and working towards greener cities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-green-600 text-lg font-bold rounded-xl hover:bg-gray-100 transition"
              >
                Start Mapping Free
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white text-lg font-bold rounded-xl hover:bg-white/10 transition"
              >
                See Community Map
              </Link>
            </div>
            <p className="text-green-200 text-sm mt-6">
              No credit card required • Free forever for communities
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center">
                <Globe className="w-8 h-8 text-green-400 mr-2" />
                <span className="text-xl font-bold">Eco-Map</span>
              </div>
              <p className="text-gray-400 mt-2">
                Building sustainable cities through community action
              </p>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-gray-400 mb-2">
                A Next.js + Firebase project for SDG 11
              </p>
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} Eco-Map • Student Project
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}