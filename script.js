// Your Firebase config here
const firebaseConfig = {
  apiKey: "AIzaSyDcSZvlFRZIzXUQubVdXG0vtAFcLkz36Cw",
  authDomain: "editable-textbox.firebaseapp.com",
  projectId: "editable-textbox",
  storageBucket: "editable-textbox.firebasestorage.app",
  messagingSenderId: "389740842278",
  appId: "1:389740842278:web:38ff22eda86476127645e7",
  measurementId: "G-1XKB9SH66B"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ✅ Get doc name from URL (?doc=...)
const params = new URLSearchParams(window.location.search);
const docId = params.get('doc') || 'default';

const editable = document.getElementById('editable');
const docRef = db.collection('notes').doc(docId);

// ✅ Load content
docRef.get().then(doc => {
  if (doc.exists) {
    editable.innerHTML = doc.data().content;
  }
});

// ✅ Save changes (debounced)
let timeout;
editable.addEventListener('input', () => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    docRef.set({ content: editable.innerHTML });
  }, 500);
});

// ✅ Listen for realtime updates
docRef.onSnapshot(doc => {
  if (!doc.metadata.hasPendingWrites) {
    editable.innerHTML = doc.exists ? doc.data().content : "";
  }
});
