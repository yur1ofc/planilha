// Sistema de Autenticação e Sincronização com Firebase

class AuthSystem {
    constructor() {
        this.user = null;
        this.isLoading = false;
        this.init();
    }

    init() {
        console.log("Iniciando sistema de autenticação...");
        
        // Aguardar o Firebase estar pronto
        setTimeout(() => {
            this.setupEventListeners();
            
            // Verificar se Firebase Auth está disponível
            if (window.auth) {
                console.log("Firebase Auth disponível, configurando observer...");
                auth.onAuthStateChanged((user) => {
                    console.log("Estado de autenticação mudou:", user ? "Usuário logado" : "Usuário deslogado");
                    if (user) {
                        this.user = user;
                        this.showApp();
                        this.carregarDadosUsuario();
                    } else {
                        this.showLogin();
                    }
                });
            } else {
                console.error("Firebase Auth não disponível");
                this.showLogin();
            }
        }, 1000);
    }

    setupEventListeners() {
        console.log("Configurando event listeners...");
        
        // Tabs de login/cadastro
        const loginTab = document.getElementById('loginTab');
        const registerTab = document.getElementById('registerTab');
        
        if (loginTab) loginTab.addEventListener('click', () => this.switchTab('login'));
        if (registerTab) registerTab.addEventListener('click', () => this.switchTab('register'));

        // Formulários
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) loginForm.addEventListener('submit', (e) => this.login(e));
        if (registerForm) registerForm.addEventListener('submit', (e) => this.register(e));
        
        // Recuperação de senha
        const forgotPassword = document.getElementById('forgotPassword');
        if (forgotPassword) forgotPassword.addEventListener('click', (e) => this.resetPassword(e));
    }

    switchTab(tab) {
        // Atualizar tabs
        document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.login-form').forEach(f => f.classList.remove('active'));
        
        if (tab === 'login') {
            document.getElementById('loginTab').classList.add('active');
            document.getElementById('loginForm').classList.add('active');
        } else {
            document.getElementById('registerTab').classList.add('active');
            document.getElementById('registerForm').classList.add('active');
        }
    }

    async login(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const loginBtn = document.getElementById('loginBtn');

        if (!this.validateEmail(email)) {
            this.showError('Por favor, insira um e-mail válido.');
            return;
        }

        this.setLoading(loginBtn, true);

        try {
            console.log("Tentando login...");
            
            if (!window.auth) {
                throw new Error("Serviço de autenticação não disponível");
            }
            
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            this.user = userCredential.user;
            console.log("Login bem-sucedido:", this.user.email);
            this.showApp();
            this.carregarDadosUsuario();
        } catch (error) {
            console.error("Erro no login:", error);
            this.handleAuthError(error);
        } finally {
            this.setLoading(loginBtn, false);
        }
    }

    async register(e) {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        const registerBtn = document.getElementById('registerBtn');

        // Validações
        if (!name.trim()) {
            this.showError('Por favor, insira seu nome completo.');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showError('Por favor, insira um e-mail válido.');
            return;
        }

        if (password.length < 6) {
            this.showError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('As senhas não coincidem.');
            return;
        }

        this.setLoading(registerBtn, true);

        try {
            console.log("Tentando criar conta...");
            
            if (!window.auth) {
                throw new Error("Serviço de autenticação não disponível");
            }
            
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            this.user = userCredential.user;
            console.log("Conta criada com sucesso:", this.user.email);
            
            // Salvar nome do usuário no Firestore (se disponível)
            if (window.db) {
                try {
                    await db.collection('users').doc(this.user.uid).set({
                        nome: name,
                        email: email,
                        dataCriacao: firebase.firestore.FieldValue.serverTimestamp(),
                        ultimoAcesso: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    console.log("Dados do usuário salvos no Firestore");
                } catch (dbError) {
                    console.warn("Não foi possível salvar no Firestore, usando localStorage:", dbError);
                }
            }

            // Inicializar dados do usuário
            await this.inicializarDadosUsuario();

            this.showApp();
            this.showSuccess('Conta criada com sucesso!');
        } catch (error) {
            console.error("Erro no cadastro:", error);
            this.handleAuthError(error);
        } finally {
            this.setLoading(registerBtn, false);
        }
    }

    async resetPassword(e) {
        e.preventDefault();
        
        const email = prompt('Digite seu e-mail para redefinir a senha:');
        if (!email) return;

        if (!this.validateEmail(email)) {
            this.showError('Por favor, insira um e-mail válido.');
            return;
        }

        try {
            if (!window.auth) {
                throw new Error("Serviço de autenticação não disponível");
            }
            
            await auth.sendPasswordResetEmail(email);
            this.showSuccess('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
        } catch (error) {
            this.handleAuthError(error);
        }
    }

    async sair() {
        try {
            // Salvar dados antes de sair
            await this.salvarDadosUsuario();
            
            if (window.auth) {
                await auth.signOut();
            }
            
            this.user = null;
            this.showLogin();
            this.showSuccess('Você saiu da sua conta.');
        } catch (error) {
            console.error('Erro ao sair:', error);
        }
    }

    // Sistema de Sincronização com Firestore
    async inicializarDadosUsuario() {
        if (!this.user) return;

        console.log("Inicializando dados do usuário...");

        // Se Firestore não estiver disponível, usar localStorage
        if (!window.db) {
            console.log("Firestore não disponível, usando localStorage");
            this.carregarDadosLocal();
            return;
        }

        try {
            const userRef = db.collection('userData').doc(this.user.uid);
            const doc = await userRef.get();

            if (!doc.exists) {
                // Criar estrutura inicial de dados
                const dadosIniciais = this.getDadosIniciais();
                await userRef.set(dadosIniciais);
                window.dadosUsuario = dadosIniciais;
                console.log("Dados iniciais criados no Firestore");
            } else {
                window.dadosUsuario = doc.data();
                console.log("Dados carregados do Firestore");
            }

            // Atualizar interface
            if (window.atualizarDashboard) {
                window.atualizarDashboard();
            }
        } catch (error) {
            console.error("Erro ao inicializar dados:", error);
            this.carregarDadosLocal();
        }
    }

    getDadosIniciais() {
        return {
            perfil: {},
            receitas: [],
            despesas: [],
            dividas: [],
            investimentos: [],
            metas: [],
            categorias: [
                { id: 1, nome: "Salário", tipo: "receita", cor: "#2ecc71" },
                { id: 2, nome: "Freelance", tipo: "receita", cor: "#3498db" },
                { id: 3, nome: "Moradia", tipo: "despesa", cor: "#e74c3c" },
                { id: 4, nome: "Alimentação", tipo: "despesa", cor: "#f39c12" },
                { id: 5, nome: "Transporte", tipo: "despesa", cor: "#9b59b6" }
            ],
            questionario: {},
            historicoPatrimonial: [
                { mes: 'Jan', valor: 1500 },
                { mes: 'Fev', valor: 1800 },
                { mes: 'Mar', valor: 2200 },
                { mes: 'Abr', valor: 2500 },
                { mes: 'Mai', valor: 2800 },
                { mes: 'Jun', valor: 3200 },
                { mes: 'Jul', valor: 3500 }
            ],
            alertas: [],
            preferencias: {
                modoEscuro: false
            },
            automações: [],
            backup: {
                ultimoBackup: null,
                proximoBackup: null
            },
            dataCriacao: new Date().toISOString(),
            ultimaAtualizacao: new Date().toISOString()
        };
    }

    async carregarDadosUsuario() {
        if (!this.user) return;

        console.log("Carregando dados do usuário...");

        // Tentar Firestore primeiro
        if (window.db) {
            try {
                const userRef = db.collection('userData').doc(this.user.uid);
                const doc = await userRef.get();

                if (doc.exists) {
                    window.dadosUsuario = doc.data();
                    console.log('Dados carregados do Firebase');
                    
                    // Atualizar última data de acesso
                    try {
                        await userRef.update({
                            ultimoAcesso: new Date().toISOString()
                        });
                    } catch (updateError) {
                        console.warn("Não foi possível atualizar último acesso:", updateError);
                    }

                    // Atualizar interface
                    if (window.atualizarDashboard) {
                        window.atualizarDashboard();
                    }
                    return;
                }
            } catch (error) {
                console.warn('Erro ao carregar do Firebase, tentando localStorage:', error);
            }
        }

        // Fallback para localStorage
        await this.inicializarDadosUsuario();
    }

    async salvarDadosUsuario() {
        if (!this.user || !window.dadosUsuario) return;

        console.log("Salvando dados do usuário...");

        // Atualizar timestamp
        window.dadosUsuario.ultimaAtualizacao = new Date().toISOString();

        // Tentar salvar no Firestore
        if (window.db) {
            try {
                const userRef = db.collection('userData').doc(this.user.uid);
                await userRef.set(window.dadosUsuario, { merge: true });
                console.log('Dados salvos no Firebase');
            } catch (error) {
                console.warn('Erro ao salvar no Firebase, usando localStorage:', error);
            }
        }

        // Sempre salvar no localStorage como backup
        this.salvarDadosLocal();
    }

    salvarDadosLocal() {
        try {
            localStorage.setItem('planilhaFinanceira', JSON.stringify(window.dadosUsuario));
            console.log('Dados salvos localmente');
        } catch (error) {
            console.error('Erro ao salvar dados localmente:', error);
        }
    }

    carregarDadosLocal() {
        try {
            const dadosSalvos = localStorage.getItem('planilhaFinanceira');
            if (dadosSalvos) {
                window.dadosUsuario = JSON.parse(dadosSalvos);
                console.log('Dados carregados do localStorage');
                
                // Atualizar interface
                if (window.atualizarDashboard) {
                    window.atualizarDashboard();
                }
            } else {
                // Se não há dados salvos, inicializar
                window.dadosUsuario = this.getDadosIniciais();
                console.log('Dados iniciais criados');
            }
        } catch (error) {
            console.error('Erro ao carregar dados locais:', error);
            window.dadosUsuario = this.getDadosIniciais();
        }
    }

    // Utilitários
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    setLoading(button, isLoading) {
        this.isLoading = isLoading;
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');

        if (isLoading) {
            btnText.classList.add('hidden');
            btnLoading.classList.remove('hidden');
            button.disabled = true;
        } else {
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');
            button.disabled = false;
        }
    }

    handleAuthError(error) {
        console.error('Erro de autenticação:', error);
        
        let mensagem = 'Erro desconhecido. Tente novamente.';
        
        switch (error.code) {
            case 'auth/invalid-email':
                mensagem = 'E-mail inválido.';
                break;
            case 'auth/user-disabled':
                mensagem = 'Esta conta foi desativada.';
                break;
            case 'auth/user-not-found':
                mensagem = 'Nenhuma conta encontrada com este e-mail.';
                break;
            case 'auth/wrong-password':
                mensagem = 'Senha incorreta.';
                break;
            case 'auth/email-already-in-use':
                mensagem = 'Este e-mail já está em uso.';
                break;
            case 'auth/weak-password':
                mensagem = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
                break;
            case 'auth/network-request-failed':
                mensagem = 'Erro de conexão. Verifique sua internet.';
                break;
            case 'auth/operation-not-allowed':
                mensagem = 'Operação não permitida. Contate o suporte.';
                break;
            default:
                mensagem = error.message || `Erro: ${error.code}`;
        }
        
        this.showError(mensagem);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        // Remover notificação anterior se existir
        const existingNotification = document.querySelector('.auth-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `auth-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            z-index: 10000;
            font-weight: 600;
            ${type === 'success' ? 'background: #2ecc71;' : 'background: #e74c3c;'}
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);

        // Remover após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    showLogin() {
        const loginScreen = document.getElementById('loginScreen');
        const appContainer = document.getElementById('appContainer');
        
        if (loginScreen) loginScreen.classList.remove('hidden');
        if (appContainer) appContainer.classList.add('hidden');
        
        console.log("Mostrando tela de login");
    }

    showApp() {
        const loginScreen = document.getElementById('loginScreen');
        const appContainer = document.getElementById('appContainer');
        
        if (loginScreen) loginScreen.classList.add('hidden');
        if (appContainer) appContainer.classList.remove('hidden');
        
        // Atualizar informações do usuário
        if (this.user) {
            const userEmail = document.getElementById('userEmail');
            if (userEmail) userEmail.textContent = this.user.email;
        }
        
        console.log("Mostrando aplicação principal");
        
        // Iniciar sincronização automática
        this.iniciarSincronizacaoAutomatica();
    }

    iniciarSincronizacaoAutomatica() {
        // Sincronizar a cada 30 segundos se estiver online
        setInterval(() => {
            if (this.user && window.dadosUsuario && navigator.onLine) {
                this.salvarDadosUsuario();
            }
        }, 30000);
    }
}

// Inicializar sistema de autenticação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM carregado, inicializando auth system...");
    window.authSystem = new AuthSystem();
});

// Função global para sair
window.sair = function() {
    if (window.authSystem) {
        window.authSystem.sair();
    }
};

// Função global para salvar dados
window.salvarDadosFirebase = function() {
    if (window.authSystem && window.authSystem.user) {
        window.authSystem.salvarDadosUsuario();
    } else {
        // Se não está logado, salvar apenas localmente
        if (window.dadosUsuario) {
            try {
                localStorage.setItem('planilhaFinanceira', JSON.stringify(window.dadosUsuario));
                console.log("Dados salvos localmente (usuário não logado)");
            } catch (error) {
                console.error("Erro ao salvar dados localmente:", error);
            }
        }
    }
};
