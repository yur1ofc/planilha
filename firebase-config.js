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
    
    // Verificar se Firebase está disponível
    if (typeof firebase === 'undefined') {
        throw new Error("Firebase não carregado");
    }
    
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
    
    // Criar objetos mock para evitar erros
    window.auth = {
        onAuthStateChanged: (callback) => {
            console.log("Mock Auth: Observador de estado configurado");
            callback(null); // Sem usuário logado
            return () => {}; // Função de unsubscribe
        },
        signInWithEmailAndPassword: () => {
            return Promise.reject(new Error("Firebase não disponível - Modo offline"));
        },
        createUserWithEmailAndPassword: () => {
            return Promise.reject(new Error("Firebase não disponível - Modo offline"));
        },
        signOut: () => {
            console.log("Mock Auth: Saindo");
            return Promise.resolve();
        },
        sendPasswordResetEmail: () => {
            return Promise.reject(new Error("Firebase não disponível - Modo offline"));
        },
        currentUser: null
    };
    
    window.db = {
        collection: () => ({
            doc: () => ({
                set: () => Promise.reject(new Error("Firestore não disponível")),
                get: () => Promise.reject(new Error("Firestore não disponível")),
                update: () => Promise.reject(new Error("Firestore não disponível"))
            })
        })
    };
    
    window.firebase = {
        firestore: {
            FieldValue: {
                serverTimestamp: () => new Date()
            }
        }
    };
    
    console.log("Modo offline ativado - Firebase não disponível");
}
