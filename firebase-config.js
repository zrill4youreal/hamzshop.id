import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getDatabase, ref, set, get, update, remove } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCeEBAUWvHEByKOqHH31Y4JDS8s1T-wBz4",
  authDomain: "website-tokostore-hamz.firebaseapp.com",
  databaseURL: "https://website-tokostore-hamz-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "website-tokostore-hamz",
  storageBucket: "website-tokostore-hamz.firebasestorage.app",
  messagingSenderId: "838369942238",
  appId: "1:838369942238:web:ccf498bb99f4d1a77f004f",
  measurementId: "G-X7NYZ2T14T"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, set, get, update, remove };
