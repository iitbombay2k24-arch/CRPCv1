# DYPIU Collab Platform 🚀

A premium, role-based academic collaboration and campus intelligence platform designed specifically for DY Patil International University (DYPIU). 

Built with React, Vite, Zustand, Tailwind CSS, and Firebase.

## 🌟 Key Features
- **Real-Time Collaboration**: Dedicated server-like Chat & DM capability with threading, pins, and rich UI.
- **Academic Ecosystem**: Full-fledged Live Quiz tracking, Task Boards (Kanban), Interactive Timetables, and Notice Boards.
- **Placement Central**: Analytics and data dashboards for active job drives.
- **Glassmorphism Design System**: Modern, dark-themed, ultra-premium UI aesthetic with animations and micro-interactions.
- **Role-Based Access Control (RBAC)**: Deep authorization handling (Student -> Admin) across platform components.

## 🛠 Tech Stack
- **Frontend Framework:** React 18 & Vite
- **Global State Management:** Zustand
- **Styling:** Vanilla Tailwind CSS
- **Icons:** Lucide-React
- **Database / Auth:** Firebase (Firestore + Authentication)
- **Deployment:** Vercel & Firebase Hosting (Zero-Config ready)

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- Active Firebase Project credentials

### Installation
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Setup environment variables by copying `.env.local`:
   Ensure your `VITE_FIREBASE_*` config items map to your Firebase credentials.
3. Run the development environment:
   ```bash
   npm run dev
   ```

### Production Build
Run the following build command which compresses the platform down via Rollup:
```bash
npm run build
```
Once generated in the `/dist` directory, you can deploy using the pre-configured `vercel.json` or `firebase.json` templates explicitly provided.

---
*Created as a comprehensive ecosystem to unify the intelligence and spirit of DYPIU.*
