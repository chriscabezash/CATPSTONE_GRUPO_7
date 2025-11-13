/* ============================================================
   Archivo: auth.js
   Descripción: Manejo de autenticación con Firebase (login, registro, logout)
   Autor: Alex (Datacensus)
   ============================================================ */

// ============================================================
// 🔹 Importar SDKs desde Firebase
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ============================================================
// 🔧 Configuración Firebase
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyBl0_qNvnPXNx0HXSjB800n5pPbiriKeRA",
  authDomain: "datacensus.firebaseapp.com",
  projectId: "datacensus",
  storageBucket: "datacensus.firebasestorage.app",
  messagingSenderId: "292911699949",
  appId: "1:292911699949:web:d37091fa5dfc6d8268b9e4",
};

// ============================================================
// 🚀 Inicialización
// ============================================================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Mantener sesión persistente (localStorage)
await setPersistence(auth, browserLocalPersistence);

const ADMIN_EMAIL = "informatico.q@gmail.com";

// ============================================================
// 🔹 GUARDAR USUARIO EN LOCALSTORAGE
// ============================================================
function saveUserSession(user) {
  localStorage.setItem("firebaseUser", JSON.stringify({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || "Usuario",
  }));
}

// ============================================================
// 🔹 LIMPIAR SESIÓN LOCAL
// ============================================================
function clearUserSession() {
  localStorage.removeItem("firebaseUser");
}

// ============================================================
// 🔹 REGISTRO DE USUARIOS NUEVOS
// ============================================================
const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("register-name").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        name: name,
        role: user.email === ADMIN_EMAIL ? "admin" : "user",
        createdAt: new Date().toISOString(),
      });

      saveUserSession(user);
      alert("✅ Registro exitoso. Redirigiendo...");
      window.location.href = "dashboard.html";
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      alert("❌ Error al registrar: " + error.message);
    }
  });
}

// ============================================================
// 🔹 LOGIN DE USUARIOS EXISTENTES
// ============================================================
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      saveUserSession(user);
      if (user.email === ADMIN_EMAIL) {
        window.location.href = "admin.html";
      } else {
        window.location.href = "dashboard.html";
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      alert("❌ Error al iniciar sesión: " + error.message);
    }
  });
}

// ============================================================
// 🔹 LOGIN CON GOOGLE
// ============================================================
const googleBtnLogin = document.getElementById("google-login");
const googleBtnRegister = document.getElementById("google-register");

async function googleSignIn() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        role: user.email === ADMIN_EMAIL ? "admin" : "user",
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );

    saveUserSession(user);
    alert("✅ Bienvenido " + user.displayName);
    if (user.email === ADMIN_EMAIL) {
      window.location.href = "admin.html";
    } else {
      window.location.href = "dashboard.html";
    }
  } catch (error) {
    console.error("Error con Google:", error);
    alert("❌ Error con Google: " + error.message);
  }
}

if (googleBtnLogin) googleBtnLogin.addEventListener("click", googleSignIn);
if (googleBtnRegister) googleBtnRegister.addEventListener("click", googleSignIn);

// ============================================================
// 🔹 CONTROL GLOBAL DE SESIÓN Y REDIRECCIÓN
// ============================================================
onAuthStateChanged(auth, (user) => {
  const page = window.location.pathname.split("/").pop();

  if (!user) {
    clearUserSession();

    // Evitar acceso a páginas privadas sin sesión
    if (["dashboard.html", "admin.html"].includes(page)) {
      window.location.href = "login.html";
    }
  } else {
    saveUserSession(user);

    // Evitar volver al login o registro si ya está logueado
    if (["login.html", "register.html"].includes(page)) {
      window.location.href = "dashboard.html";
    }

    // Verificar acceso admin
    if (page === "admin.html" && user.email !== ADMIN_EMAIL) {
      alert("⚠️ Acceso denegado. No eres administrador.");
      window.location.href = "dashboard.html";
    }
  }
});

// ============================================================
// 🔹 CERRAR SESIÓN
// ============================================================
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    clearUserSession();
    window.location.href = "index.html";
  });
}

console.log("✅ Módulo auth.js cargado correctamente");
