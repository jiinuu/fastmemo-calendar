import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA9A9t5frtp2-NV4507wcIcL-h6pMQbIdI",
  authDomain: "fast-memo.firebaseapp.com",
  projectId: "fast-memo",
  storageBucket: "fast-memo.firebasestorage.app",
  messagingSenderId: "403803428752",
  appId: "1:403803428752:web:5013f9537631b741208515"
};

// Next.js는 핫 리로딩 때문에 앱이 중복 초기화되는 걸 방지해야 합니다.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };