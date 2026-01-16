// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ──────────────────────────────────────────────
// FIREBASE CONFIG
// ──────────────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyAXEW2rA3U7-V7SeDtE2VGpgQDzEHQnZSE",
    authDomain: "my-students-m.firebaseapp.com",
    projectId: "my-students-m",
    storageBucket: "my-students-m.firebasestorage.app",
    messagingSenderId: "734163210024",
    appId: "1:734163210024:web:39b5aea613a12f56688a1d",
    measurementId: "G-JMYYD46EF3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ──────────────────────────────────────────────
// STATE & DATA
// ──────────────────────────────────────────────
let currentUser = null;
let courses = [];

// ──────────────────────────────────────────────
// DOM Elements
// ──────────────────────────────────────────────
const loginFormEl    = document.getElementById('loginForm');
const signupFormEl   = document.getElementById('signupForm');
const loginContainer = document.getElementById('login-form');
const signupContainer= document.getElementById('signup-form');
const dashboard      = document.getElementById('dashboard');
const studentNameEl  = document.getElementById('studentName');
const courseList     = document.getElementById('courseList');
const semGPAEl       = document.getElementById('semGPA');
const cgpaEl         = document.getElementById('cgpaDisplay');
const saveBtn        = document.getElementById('saveBtn');

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────
function showAuth(showLogin = true) {
    loginContainer.classList.toggle('hidden', !showLogin);
    signupContainer.classList.toggle('hidden', showLogin);
    dashboard.classList.add('hidden');
}

function showDashboard() {
    loginContainer.classList.add('hidden');
    signupContainer.classList.add('hidden');
    dashboard.classList.remove('hidden');
}

async function loadCourses() {
    if (!currentUser) return;
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
            courses = userDoc.data().courses || [];
            renderCourses();
            calculateGrades();
        }
    } catch (error) {
        console.error("Error loading courses:", error);
    }
}

async function saveCourses() {
    if (!currentUser) return;
    try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
            courses: courses
        });
    } catch (error) {
        console.error("Error saving courses:", error);
    }
}

// ──────────────────────────────────────────────
// GRADE CALCULATIONS
// ──────────────────────────────────────────────
function getGradePoint(grade) {
    const map = { 'A':4.0, 'B':3.0, 'C':2.0, 'D':1.0, 'F':0.0, 'N/A':0, '':0 };
    return map[grade.toUpperCase()] || 0;
}

function calculateGrades() {
    let semPoints = 0, semCredits = 0;

    courses.forEach(c => {
        if (c.status === 'Completed' && c.grade !== 'N/A') {
            const points = getGradePoint(c.grade);
            semPoints += points * Number(c.credit);
            semCredits += Number(c.credit);
        }
    });

    const semGPA = semCredits > 0 ? (semPoints / semCredits).toFixed(2) : '—';
    const cgpa = semGPA;

    semGPAEl.textContent = semGPA;
    cgpaEl.textContent = cgpa;
}

function renderCourses() {
    courseList.innerHTML = '';
    courses.forEach((c, i) => {
        const statusClass = (c.status || 'unknown').toLowerCase();
        const gradeClass  = (c.grade  || 'na').toLowerCase();

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${c.code || '—'}</td>
            <td>${c.name || '—'}</td>
            <td><span class="status-badge status-${statusClass}">${c.status || '—'}</span></td>
            <td class="grade-${gradeClass}">${c.grade || '—'}</td>
            <td>${c.credit || '—'}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editCourse(${i})">Edit</button>
                <button class="action-btn delete-btn" onclick="deleteCourse(${i})">Delete</button>
            </td>
        `;
        courseList.appendChild(tr);
    });
}

// ──────────────────────────────────────────────
// CRUD
// ──────────────────────────────────────────────
function addCourse(code, name, status, grade, credit) {
    courses.push({ code, name, status, grade, credit });
    saveCourses();
    renderCourses();
    calculateGrades();
}

function updateCourse(index, code, name, status, grade, credit) {
    courses[index] = { code, name, status, grade, credit };
    saveCourses();
    renderCourses();
    calculateGrades();
    saveBtn.textContent = "Add Course";
    saveBtn.onclick = null;
}

window.deleteCourse = function(index) {
    if (!confirm("Delete this course?")) return;
    courses.splice(index, 1);
    saveCourses();
    renderCourses();
    calculateGrades();
}

window.editCourse = function(index) {
    const c = courses[index];
    document.getElementById('courseCode').value    = c.code;
    document.getElementById('courseName').value    = c.name;
    document.getElementById('status').value        = c.status;
    document.getElementById('grade').value         = c.grade;
    document.getElementById('creditHours').value   = c.credit;

    saveBtn.textContent = "Update Course";
    saveBtn.onclick = e => {
        e.preventDefault();
        const code   = document.getElementById('courseCode').value.trim();
        const name   = document.getElementById('courseName').value.trim();
        const status = document.getElementById('status').value;
        const grade  = document.getElementById('grade').value;
        const credit = document.getElementById('creditHours').value;

        if (code && name && status && grade && credit) {
            updateCourse(index, code, name, status, grade, credit);
        }
    };
}

// ──────────────────────────────────────────────
// EVENT LISTENERS
// ──────────────────────────────────────────────
document.getElementById('showSignup').onclick = e => {
    e.preventDefault();
    showAuth(false);
};

document.getElementById('showLogin').onclick = e => {
    e.preventDefault();
    showAuth(true);
};

loginFormEl.addEventListener('submit', async e => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Convert username to email format for Firebase Auth
    const email = `${username}@studentportal.com`;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // User signed in successfully - handled by onAuthStateChanged
    } catch (error) {
        console.error("Login error:", error);
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            alert("Incorrect username or password");
        } else if (error.code === 'auth/invalid-email') {
            alert("Invalid username format");
        } else {
            alert("Login failed: " + error.message);
        }
    }
});

signupFormEl.addEventListener('submit', async e => {
    e.preventDefault();

    const username = document.getElementById('signupUsername').value.trim();
    const fullname = document.getElementById('signupFullname').value.trim();
    const password = document.getElementById('signupPassword').value;

    if (password.length < 6) {
        alert("Password must be at least 6 characters");
        return;
    }

    // Convert username to email format for Firebase Auth
    const email = `${username}@studentportal.com`;

    try {
        // Check if username already exists
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            alert("Username already exists! Please choose another.");
            return;
        }

        // Create user with Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store user data in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            username: username,
            fullname: fullname,
            email: email,
            courses: [],
            createdAt: new Date().toISOString()
        });

        alert("Account created successfully! You can now login.");
        showAuth(true);
        signupFormEl.reset();
    } catch (error) {
        console.error("Signup error:", error);
        if (error.code === 'auth/email-already-in-use') {
            alert("Username already exists! Please choose another.");
        } else if (error.code === 'auth/weak-password') {
            alert("Password is too weak. Please use a stronger password.");
        } else {
            alert("Signup failed: " + error.message);
        }
    }
});

document.getElementById('logoutBtn').onclick = async () => {
    try {
        await signOut(auth);
        currentUser = null;
        courses = [];
        showAuth(true);
        loginFormEl.reset();
        signupFormEl.reset();
        saveBtn.textContent = "Add Course";
        saveBtn.onclick = null;
    } catch (error) {
        console.error("Logout error:", error);
        alert("Logout failed: " + error.message);
    }
};

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                studentNameEl.textContent = userData.fullname || userData.username;
                await loadCourses();
                showDashboard();
            }
        } catch (error) {
            console.error("Error loading user data:", error);
        }
    } else {
        currentUser = null;
        showAuth(true);
    }
});

document.getElementById('courseForm').addEventListener('submit', e => {
    e.preventDefault();

    if (saveBtn.textContent.includes("Add")) {
        const code   = document.getElementById('courseCode').value.trim();
        const name   = document.getElementById('courseName').value.trim();
        const status = document.getElementById('status').value;
        const grade  = document.getElementById('grade').value;
        const credit = document.getElementById('creditHours').value;

        if (code && name && status && grade && credit) {
            addCourse(code, name, status, grade, credit);
            e.target.reset();
        }
    }
});

// Start with login screen
showAuth(true);