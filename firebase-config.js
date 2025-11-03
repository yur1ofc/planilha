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
    // Verificar se o Firebase já foi inicializado
    if (!firebase.apps.length) {
        const app = firebase.initializeApp(firebaseConfig);
        console.log("Firebase inicializado com sucesso");
    } else {
        console.log("Firebase já estava inicializado");
    }

    // Initialize Firebase Authentication and get a reference to the service
    const auth = firebase.auth();
    
    // Initialize Cloud Firestore and get a reference to the service
    const db = firebase.firestore();
    
    // Configurações do Firestore para desenvolvimento
    if (window.location.hostname === "localhost") {
        db.settings({
            experimentalForceLongPolling: true,
            merge: true
        });
        console.log("Firestore configurado para desenvolvimento local");
    }

    // Export for use in other files
    window.firebase = firebase;
    window.auth = auth;
    window.db = db;

} catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
}
