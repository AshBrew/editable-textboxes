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

// ✅ Init Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

//DOM elements
const editable = document.getElementById('editable');
const newDocInput = document.getElementById('newDocName');
const createBtn = document.getElementById('createDoc');
const deleteBtn = document.getElementById('deleteDoc');
const toggleBtn = document.getElementById('toggleBtn');

//custom dropdown elements
const dropdownBtn = document.getElementById('dropdownBtn');
const dropdownList = document.getElementById('dropdownList');

let currentDoc = null;
let saveTimeout = null;
let docs = [];

toggleBtn.onclick = () => {
  var x = document.getElementById("doc-controls");
  if (x.style.display === "none") {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
}

// Populate the custom dropdown list with docs and select the current one
function populateDropdown(docsList, selected) {
  docs = docsList;
  dropdownList.innerHTML = '';

  docs.forEach(docId => {
    const li = document.createElement('li');
    li.textContent = docId;
    li.setAttribute('role', 'option');
    li.setAttribute('tabindex', '0');
    li.setAttribute('aria-selected', docId === selected ? 'true' : 'false');

    li.onclick = () => selectDoc(docId);
    li.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectDoc(docId);
      }
    };

    dropdownList.appendChild(li);
  });

  dropdownBtn.textContent = selected ? `${selected} ` : 'select document';
}

// Select a document, update URL, and load content
function selectDoc(docId) {
  if (docId === currentDoc) {
    closeDropdown();
    return;
  }
  currentDoc = docId;
  dropdownBtn.textContent = `${docId} ▼`;
  closeDropdown();

  const url = new URL(window.location);
  url.searchParams.set('doc', docId);
  window.history.pushState(null, '', url);

  loadDocument(docId);
}

// Close the dropdown list
function closeDropdown() {
  dropdownList.classList.add('hidden');
  dropdownBtn.setAttribute('aria-expanded', 'false');
}

// Toggle dropdown open/close
dropdownBtn.onclick = () => {
  const expanded = dropdownBtn.getAttribute('aria-expanded') === 'true';
  if (expanded) {
    closeDropdown();
  } else {
    dropdownList.classList.remove('hidden');
    dropdownBtn.setAttribute('aria-expanded', 'true');
    dropdownList.focus();
  }
};

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  if (!dropdownBtn.contains(e.target) && !dropdownList.contains(e.target)) {
    closeDropdown();
  }
});

// Load the list of documents from Firestore and populate dropdown
function loadDocumentList(selectedId) {
  db.collection('notes').get().then(snapshot => {
    const docIds = [];
    snapshot.forEach(doc => docIds.push(doc.id));
    if (!docIds.includes(selectedId) && docIds.length > 0) {
      selectedId = docIds[0];
    }
    populateDropdown(docIds, selectedId);
  });
}

// Load a document and sync content
function loadDocument(docId) {
  currentDoc = docId;
  const docRef = db.collection('notes').doc(docId);

  docRef.get().then(doc => {
    editable.innerHTML = doc.exists ? doc.data().content : '';
  });

  // Save changes with debounce
  editable.oninput = () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      docRef.set({ content: editable.innerHTML });
    }, 500);
  };

  // Real-time updates from Firestore
  docRef.onSnapshot(doc => {
    if (!doc.metadata.hasPendingWrites) {
      editable.innerHTML = doc.exists ? doc.data().content : '';
    }
  });

  loadDocumentList(docId);
}

// Create a new document via input & redirect
createBtn.onclick = () => {
  const newDoc = newDocInput.value.trim();
  if (!newDoc) return;
  newDocInput.value = '';
  selectDoc(newDoc);
};

// Delete the current document
deleteBtn.onclick = () => {
  if (!currentDoc) return;
  if (!confirm(`Delete document "${currentDoc}"? This cannot be undone.`)) return;

  db.collection('notes').doc(currentDoc).delete().then(() => {
    // After delete, reload docs and pick another or default
    db.collection('notes').get().then(snapshot => {
      const remaining = [];
      snapshot.forEach(doc => remaining.push(doc.id));

      const nextDoc = remaining.length > 0 ? remaining[0] : 'default';
      selectDoc(nextDoc);
    });
  });
};

// Initial load on page ready
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const startingDoc = params.get('doc') || 'default';
  loadDocument(startingDoc);
});
