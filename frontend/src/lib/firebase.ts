import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "REDACTED_FIREBASE_API_KEY",
  authDomain: "darwinagent.firebaseapp.com",
  projectId: "darwinagent",
  storageBucket: "darwinagent.firebasestorage.app",
  messagingSenderId: "43894313888",
  appId: "1:43894313888:web:4fc3d264d393c8d42ccac5",
  measurementId: "G-ZLCSLM1D2Z"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
