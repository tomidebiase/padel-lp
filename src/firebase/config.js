import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA9ag5Q3rt-P3PAiBGmb7Iy7DLSTymnPhI",
  authDomain: "padellp-6f520.firebaseapp.com",
  projectId: "padellp-6f520",
  storageBucket: "padellp-6f520.firebasestorage.app",
  messagingSenderId: "1045198773261",
  appId: "1:1045198773261:web:bf379dad759c7ec08d4944",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);