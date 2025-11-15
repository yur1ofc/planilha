// Sistema de Autenticação com Firebase
class AuthSystem {
    constructor() {
        this.user = null;
        this.isLoading = false;
        this.firebaseAvailable = window.firebaseAvailable || false;
        this.auth = window.auth;
        this.db = window.db;
        this.init();
    }

    init() {
        console.log("🚀 Iniciando sistema de autenticação...");
        
        if (this.firebaseAvailable) {
            console.log("🔥 Modo Firebase ativo");
            this.setupFirebaseAuth();
        } else {
            console.log("📴 Modo offline ativo");
            this.setupLocalAuth();
        }
    }

    setupFirebaseAuth() {
        // Observador de estado de autenticação
        this.auth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log("👤 Usuário Firebase autenticado:", user.email);
                await this.handleUserAuthenticated(user);
            } else {
                console.log("🚪 Nenhum usuário autenticado no Firebase");
                this.user = null;
                this.showLoginScreen();
            }
        });
    }

    async handleUserAuthenticated(firebaseUser) {
        try {
            this.user = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL
            };
            
            await this.loadUserDataFromFirestore(firebaseUser.uid);
            
        } catch (error) {
            console.error("❌ Erro ao processar usuário autenticado:", error);
            this.showLoginScreen();
        }
    }

    async loadUserDataFromFirestore(uid) {
        try {
            const userDoc = await this.db.collection('users').doc(uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.user = { ...this.user, ...userData };
                console.log("📊 Dados do usuário carregados do Firestore");
                this.showAppScreen();
            } else {
                console.log("📝 Usuário não encontrado no Firestore");
                await this.createUserInFirestore(uid);
            }
        } catch (error) {
            console.error("❌ Erro ao carregar dados do Firestore:", error);
            this.showAppScreen(); // Mostrar app mesmo com erro
        }
    }

    async createUserInFirestore(uid) {
        try {
            const userData = {
                email: this.user.email,
                displayName: this.user.displayName || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                receitas: [],
                despesas: [],
                investimentos: [],
                metas: [],
                settings: {
                    theme: 'light',
                    currency: 'BRL'
                }
            };
            
            await this.db.collection('users').doc(uid).set(userData);
            this.user = { ...this.user, ...userData };
            console.log("✅ Usuário criado no Firestore");
            this.showAppScreen();
        } catch (error) {
            console.error("❌ Erro ao criar usuário no Firestore:", error);
            this.showAppScreen();
        }
    }

    setupLocalAuth() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            console.log("👤 Usuário encontrado no localStorage");
            this.user = JSON.parse(savedUser);
            this.showAppScreen();
        }
    }

    // 🔐 REGISTRO
    async register(userData) {
        if (this.firebaseAvailable) {
            return await this.registerWithFirebase(userData);
        } else {
            return this.registerLocal(userData);
        }
    }

    async registerWithFirebase(userData) {
        try {
            console.log("📝 Tentando registrar com Firebase...");
            
            // Criar usuário no Firebase Auth
            const userCredential = await this.auth.createUserWithEmailAndPassword(
                userData.email, 
                userData.password
            );
            
            const user = userCredential.user;
            
            // Atualizar perfil do usuário
            await user.updateProfile({
                displayName: userData.nickname || userData.name
            });

            // Preparar dados para Firestore
            const firestoreUserData = {
                name: userData.name,
                nickname: userData.nickname,
                email: userData.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                avatar: null,
                receitas: [],
                despesas: [],
                investimentos: [],
                metas: [],
                settings: {
                    theme: 'light',
                    currency: 'BRL'
                }
            };

            // Criar documento no Firestore
            await this.db.collection('users').doc(user.uid).set(firestoreUserData);

            console.log("✅ Usuário registrado com sucesso no Firebase");
            
            return { 
                success: true, 
                user: {
                    id: user.uid,
                    ...firestoreUserData
                }
            };

        } catch (error) {
            console.error("❌ Erro no registro Firebase:", error);
            return { 
                success: false, 
                error: this.getFirebaseError(error) 
            };
        }
    }

    registerLocal(userData) {
        try {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            
            if (users.find(user => user.email === userData.email)) {
                return { success: false, error: 'Este e-mail já está cadastrado!' };
            }

            const newUser = {
                id: this.generateId(),
                ...userData,
                createdAt: new Date().toISOString(),
                receitas: [],
                despesas: [],
                investimentos: [],
                metas: [],
                settings: {
                    theme: 'light',
                    currency: 'BRL'
                }
            };

            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            
            return { success: true, user: newUser };

        } catch (error) {
            console.error("❌ Erro no registro local:", error);
            return { success: false, error: 'Erro ao criar conta' };
        }
    }

    // 🔑 LOGIN
    async login(email, password) {
        if (this.firebaseAvailable) {
            return await this.loginWithFirebase(email, password);
        } else {
            return this.loginLocal(email, password);
        }
    }

    async loginWithFirebase(email, password) {
        try {
            console.log("🔑 Tentando login com Firebase...");
            
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            console.log("✅ Login Firebase bem-sucedido:", user.email);
            return { success: true, user: user };

        } catch (error) {
            console.error("❌ Erro no login Firebase:", error);
            return { 
                success: false, 
                error: this.getFirebaseError(error) 
            };
        }
    }

    loginLocal(email, password) {
        try {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                return { success: true, user: user };
            } else {
                return { success: false, error: 'E-mail ou senha incorretos!' };
            }
        } catch (error) {
            return { success: false, error: 'Erro ao fazer login' };
        }
    }

    // 🚪 SAIR
    async sair() {
        try {
            console.log("🚪 Saindo da conta...");
            
            if (this.firebaseAvailable) {
                await this.auth.signOut();
            }
            
            this.user = null;
            localStorage.removeItem('currentUser');
            this.showLoginScreen();
            
        } catch (error) {
            console.error('❌ Erro ao sair:', error);
        }
    }

    // 🛠️ UTILITÁRIOS
    getFirebaseError(error) {
        const errorMessages = {
            'auth/email-already-in-use': 'Este e-mail já está em uso.',
            'auth/invalid-email': 'E-mail inválido.',
            'auth/operation-not-allowed': 'Operação não permitida.',
            'auth/weak-password': 'Senha muito fraca.',
            'auth/user-disabled': 'Esta conta foi desativada.',
            'auth/user-not-found': 'Usuário não encontrado.',
            'auth/wrong-password': 'Senha incorreta.',
            'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.'
        };
        
        return errorMessages[error.code] || 'Erro desconhecido. Tente novamente.';
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    showLoginScreen() {
        const loginScreen = document.getElementById('loginScreen');
        const appContainer = document.getElementById('appContainer');
        
        if (loginScreen) loginScreen.classList.remove('hidden');
        if (appContainer) appContainer.classList.add('hidden');
    }

    showAppScreen() {
        const loginScreen = document.getElementById('loginScreen');
        const appContainer = document.getElementById('appContainer');
        
        if (loginScreen) loginScreen.classList.add('hidden');
        if (appContainer) appContainer.classList.remove('hidden');
        
        // Disparar evento para o FinancialManager
        if (window.financialManager && this.user) {
            window.financialManager.handleAuthSuccess(this.user);
        }
    }
}

// Inicializar sistema de autenticação
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 DOM carregado, inicializando auth system...");
    window.authSystem = new AuthSystem();
});

// Função global para sair
window.sair = function() {
    if (window.authSystem) {
        window.authSystem.sair();
    }
};

window.logout = window.sair;
