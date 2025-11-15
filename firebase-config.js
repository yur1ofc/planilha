// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA9V9Ch6pTSKhS-CqHKhxztMI6J4863cjI",
    authDomain: "planilha-d1bb2.firebaseapp.com",
    projectId: "planilha-d1bb2",
    storageBucket: "planilha-d1bb2.firebasestorage.app",
    messagingSenderId: "1075601741367",
    appId: "1:1075601741367:web:d78e0a3f769d21109b91b2"
};

// Inicialização do Firebase
let firebaseApp;
let auth;
let db;
let firebaseAvailable = false;

try {
    if (typeof firebase !== 'undefined') {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        firebaseAvailable = true;
        
        console.log("✅ Firebase inicializado com sucesso");
        console.log("✅ Firebase Auth disponível");
        console.log("✅ Firestore disponível");
        
        // Disponibilizar globalmente
        window.firebase = firebase;
        window.auth = auth;
        window.db = db;
        window.firebaseAvailable = firebaseAvailable;
        
    } else {
        console.log("❌ Firebase não disponível");
        window.firebaseAvailable = false;
    }
} catch (error) {
    console.log("❌ Erro ao inicializar Firebase:", error);
    window.firebaseAvailable = false;
}
