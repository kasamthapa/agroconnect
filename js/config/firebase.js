// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCuyD8VRR3rLu2JO0S5KNGx6OzStkCTiAk",
    authDomain: "agroconnect-abc63.firebaseapp.com",
    projectId: "agroconnect-abc63",
    storageBucket: "agroconnect-abc63.firebasestorage.app",
    messagingSenderId: "774655019368",
    appId: "1:774655019368:web:d5703e4217877912a7aedd",
    measurementId: "G-3P34D58N52"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Initialize Analytics
const analytics = firebase.analytics();

// Get Firebase services
const db = firebase.firestore();
const auth = firebase.auth();
let storage;
try {
    storage = firebase.storage();
} catch (error) {
    console.error('Error initializing Firebase Storage:', error);
    storage = null;
}

// Enable offline persistence for Firestore
db.enablePersistence()
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code == 'unimplemented') {
            console.warn('The current browser does not support persistence.');
        }
    });

// Export Firebase instances
export { app, db, auth, storage, analytics }; 