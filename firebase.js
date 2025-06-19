const firebaseConfig = {
  apiKey: "AIzaSyC34kR1KqtpFh13pqyVJMUVDbPnkYh27lw",
  authDomain: "team-estimator.firebaseapp.com",
  projectId: "team-estimator",
  storageBucket: "team-estimator.firebasestorage.app",
  messagingSenderId: "371255139544",
  appId: "1:371255139544:web:54280b68296ae341288bad",
  measurementId: "G-6W7STHM4NG"
};

firebase.initializeApp(firebaseConfig);
export const db = firebase.database();
