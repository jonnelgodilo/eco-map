# 🌍 ECO-MAP: Bulan, Sorsogon Sustainability Mapping Platform

Live Demo: https://eco-mapph.vercel.app

# 📱 Project Overview
A hyperlocal community mapping tool for residents of Bulan, Sorsogon to collaboratively document and discover sustainability resources. This platform enables digital "bayanihan" where locals can map eco-friendly spots, share environmental initiatives, and build a guide to sustainable living.

# ✨ Features
- **🗺️ Interactive Map** - Crowdsourced sustainability locations in Bulan

- **📍 Pin Contribution** - Add water stations, eco-stores, green spaces

- **👤 User Profiles** - Track contributions & achievements

- **📊 Sustainability Dashboard** - Real-time statistics

- **🔐 User Authentication** - Secure login and registration

- **🎯 SDG 11 Alignment** - Supports Sustainable Cities goal

# 🚀 Getting Started

# Prerequisites

Node.js

npm, yarn, pnpm, or bun

Firebase account for backend services

# Installation

# 1. Clone the repository:
```
git clone https://github.com/jonnelgodilo/eco-map.git
cd eco-map
```

# 2. Install dependencies:
```
npm install
```
# 3. Set up Firebase:

- Create a Firebase project at https://firebase.google.com

- Enable Authentication (Email/Password)

- Create a Firestore Database

- Add your Firebase config to .env.local

# 4. Run the development server:
```
npm run dev
```
Open http://localhost:3000 in your browser

# 🛠️ Technology Stack
- Frontend: Next.js 14 (App Router), React, TypeScript

- Styling: Tailwind CSS, globals.css

- Mapping: Leaflet.js, OpenStreetMap

- Backend: Firebase (Authentication, Firestore)

- Database: Firestore NoSQL Database

- Hosting: Vercel

- Language: TypeScript

# 📁 Project Structure
```
eco-map/
├── app/                      # Next.js App Router Pages
│   ├── add-pin/             # Add new sustainability pin page
│   ├── dashboard/           # Sustainability dashboard page
│   ├── forgot-password/     # Password recovery page
│   ├── login/               # User login page
│   ├── map/                 # Interactive map page
│   ├── profile/             # User profile page
│   ├── signup/              # User registration page
│   ├── test/                # Testing page
│   ├── favicon.ico          # Website icon
│   ├── globals.css          # Global CSS styles
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Home page
├── components/              # React Components
│   ├── InteractiveMap.tsx   # Main map component
│   └── OpenStreetMap.tsx    # OpenStreetMap integration
├── lib/                     # Utility Functions
│   └── firebase.ts          # Firebase configuration
├── public/                  # Static Assets
│   └── (images, icons, etc.)
├── .gitignore               # Git ignore file
├── next.config.ts           # Next.js configuration
├── package.json             # Dependencies
├── postcss.config.js        # PostCSS configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```
# 👥 Team Members
**Jonnel A. Godilo**

**Jenny D. Gipa**

**Alliah Joy C. Besa**

**Mavel B. Maraño**
