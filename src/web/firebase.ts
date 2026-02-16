// Firebase Configuration
// DO NOT COMMIT THIS FILE TO PUBLIC REPOSITORIES

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDvDKg71xvmIqJcGqsj3WFaY9B2AXJdfAk",
  authDomain: "cratestream-e374c.firebaseapp.com",
  projectId: "cratestream-e374c",
  storageBucket: "cratestream-e374c.firebasestorage.app",
  messagingSenderId: "495574745944",
  appId: "1:495574745944:web:ada4fe973bd6d591799b2d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
