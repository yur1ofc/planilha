// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA9V9Ch6pTSKhS-CqHKhxztMI6J4863cjI",
    authDomain: "planilha-d1bb2.firebaseapp.com",
    projectId: "planilha-d1bb2",
    storageBucket: "planilha-d1bb2.firebasestorage.app",
    messagingSenderId: "1075601741367",
    appId: "1:1075601741367:web:d78e0a3f769d21109b91b2"
};

// Initialize Firebase
try {
    console.log("Inicializando Firebase...");
    
    // Verificar se o Firebase já foi inicializado
    if (!firebase.apps.length) {
        const app = firebase.initializeApp(firebaseConfig);
        console.log("Firebase inicializado com sucesso");
    } else {
        console.log("Firebase já estava inicializado");
    }

    // Initialize Firebase Authentication and get a reference to the service
    const auth = firebase.auth();
    console.log("Firebase Auth inicializado");
    
    // Initialize Cloud Firestore and get a reference to the service
    const db = firebase.firestore();
    console.log("Firebase Firestore inicializado");
    
    // Configurações do Firestore para desenvolvimento
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        db.settings({
            experimentalForceLongPolling: true
        });
        console.log("Firestore configurado para desenvolvimento local");
    }

    // Export for use in other files
    window.firebase = firebase;
    window.auth = auth;
    window.db = db;

    console.log("Firebase configurado com sucesso!");

} catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
    // Criar objetos vazios para evitar erros
    window.auth = {
        onAuthStateChanged: (callback) => callback(null),
        signInWithEmailAndPassword: () => Promise.reject(new Error("Firebase não disponível")),
        createUserWithEmailAndPassword: () => Promise.reject(new Error("Firebase não disponível")),
        signOut: () => Promise.reject(new Error("Firebase não disponível")),
        sendPasswordResetEmail: () => Promise.reject(new Error("Firebase não disponível"))
    };
    window.db = null;
    window.firebase = null;
}
