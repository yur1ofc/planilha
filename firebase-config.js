// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA9V9Ch6pTSKhS-CqHKhxztMI6J4863cjI",
    authDomain: "planilha-d1bb2.firebaseapp.com",
    projectId: "planilha-d1bb2",
    storageBucket: "planilha-d1bb2.firebasestorage.app",
    messagingSenderId: "1075601741367",
    appId: "1:1075601741367:web:d78e0a3f769d21109b91b2"
};

// Inicialização condicional do Firebase
try {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            const app = firebase.initializeApp(firebaseConfig);
            console.log("Firebase inicializado com sucesso");
            
            const auth = firebase.auth();
            const db = firebase.firestore();
            
            console.log("Firebase Auth inicializado");
            console.log("Firebase Firestore inicializado");
            
            window.firebase = firebase;
            window.auth = auth;
            window.db = db;
        } else {
            console.log("Firebase já inicializado");
        }
    } else {
        console.log("Firebase não disponível - Modo offline ativado");
    }
} catch (error) {
    console.log("Firebase não disponível - Modo offline ativado", error);
}
