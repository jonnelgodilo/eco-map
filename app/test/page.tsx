// app/test/page.tsx
"use client";

import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { useState } from "react";

export default function TestPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const testFirebase = async () => {
    try {
      // 1. Create user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      
      // 2. Add test data to Firestore
      const docRef = await addDoc(collection(db, "testUsers"), {
        email: email,
        createdAt: new Date().toISOString(),
        test: true
      });
      
      setMessage(`✅ Success! User created & data saved to Firestore.`);
      console.log("Document written with ID: ", docRef.id);
      
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
      console.error("Error details:", error);
    }
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Firebase Connection Test</h1>
      <p className="text-gray-600">Test if Firebase is properly connected</p>
      
      <div className="mt-6 space-y-4 max-w-md">
        <div>
          <label className="block mb-2">Test Email:</label>
          <input
            type="email"
            placeholder="test@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 w-full rounded"
          />
        </div>
        
        <div>
          <label className="block mb-2">Test Password (min 6 chars):</label>
          <input
            type="password"
            placeholder="password123"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 w-full rounded"
          />
        </div>
        
        <button
          onClick={testFirebase}
          className="bg-green-600 hover:bg-green-700 text-white p-3 rounded w-full"
        >
          Test Firebase Connection
        </button>
        
        {message && (
          <div className={`p-4 rounded ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}
        
        <div className="mt-8 p-4 bg-blue-50 rounded">
          <h3 className="font-bold">What should happen:</h3>
          <ul className="list-disc pl-5 mt-2 text-sm">
            <li>User account created in Firebase Auth</li>
            <li>Test data saved to Firestore database</li>
            <li>Check Firebase Console to see the data</li>
          </ul>
        </div>
      </div>
    </div>
  );
}