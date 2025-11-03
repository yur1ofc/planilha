// Sistema de Autenticação e Sincronização com Firebase

class AuthSystem {
    constructor() {
        this.user = null;
        this.isLoading = false;
        this.init();
    }

    init() {
        // Verificar se usuário já está logado
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.user = user;
                this.showApp();
                this.carregarDadosUsuario();
            } else {
                this.showLogin();
            }
        });

        // Configurar event listeners para os formulários
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Tabs de login/cadastro
        document.getElementById('loginTab').addEventListener('click', () => this.switchTab('login'));
        document.getElementById('registerTab').addEventListener('click', () => this.switchTab('register'));

        // Formulários
        document.getElementById('loginForm').addEventListener('submit', (e) => this.login(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.register(e));
        
        // Recuperação de senha
        document.getElementById('forgotPassword').addEventListener('click', (e) => this.resetPassword(e));
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
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            this.user = userCredential.user;
            this.showApp();
            this.carregarDadosUsuario();
        } catch (error) {
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
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            this.user = userCredential.user;
            
            // Salvar nome do usuário no Firestore
            await db.collection('users').doc(this.user.uid).set({
                nome: name,
                email: email,
                dataCriacao: firebase.firestore.FieldValue.serverTimestamp(),
                ultimoAcesso: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Inicializar dados do usuário
            await this.inicializarDadosUsuario();

            this.showApp();
            this.showSuccess('Conta criada com sucesso!');
        } catch (error) {
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
            await auth.signOut();
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

        const userRef = db.collection('userData').doc(this.user.uid);
        const doc = await userRef.get();

        if (!doc.exists) {
            // Criar estrutura inicial de dados
            const dadosIniciais = {
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
                dataCriacao: firebase.firestore.FieldValue.serverTimestamp(),
                ultimaAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
            };

            await userRef.set(dadosIniciais);
            window.dadosUsuario = dadosIniciais;
        } else {
            window.dadosUsuario = doc.data();
        }

        // Atualizar interface
        if (window.atualizarDashboard) {
            window.atualizarDashboard();
        }
    }

    async carregarDadosUsuario() {
        if (!this.user) return;

        try {
            const userRef = db.collection('userData').doc(this.user.uid);
            const doc = await userRef.get();

            if (doc.exists) {
                window.dadosUsuario = doc.data();
                
                // Atualizar última data de acesso
                await userRef.update({
                    ultimoAcesso: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Atualizar interface
                if (window.atualizarDashboard) {
                    window.atualizarDashboard();
                }

                console.log('Dados carregados do Firebase');
            } else {
                await this.inicializarDadosUsuario();
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.showError('Erro ao carregar dados. Usando dados locais.');
            
            // Tentar carregar do localStorage como fallback
            this.carregarDadosLocal();
        }
    }

    async salvarDadosUsuario() {
        if (!this.user || !window.dadosUsuario) return;

        try {
            const userRef = db.collection('userData').doc(this.user.uid);
            
            await userRef.set({
                ...window.dadosUsuario,
                ultimaAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log('Dados salvos no Firebase');
            
            // Também salvar no localStorage como backup
            this.salvarDadosLocal();
            
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            this.showError('Erro ao sincronizar dados. Salvando localmente.');
            
            // Salvar apenas no localStorage como fallback
            this.salvarDadosLocal();
        }
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
            }
        } catch (error) {
            console.error('Erro ao carregar dados locais:', error);
        }
    }

    // Sincronização automática a cada 30 segundos
    iniciarSincronizacaoAutomatica() {
        setInterval(() => {
            if (this.user && window.dadosUsuario) {
                this.salvarDadosUsuario();
            }
        }, 30000); // 30 segundos
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
        
        switch (error.code) {
            case 'auth/invalid-email':
                this.showError('E-mail inválido.');
                break;
            case 'auth/user-disabled':
                this.showError('Esta conta foi desativada.');
                break;
            case 'auth/user-not-found':
                this.showError('Nenhuma conta encontrada com este e-mail.');
                break;
            case 'auth/wrong-password':
                this.showError('Senha incorreta.');
                break;
            case 'auth/email-already-in-use':
                this.showError('Este e-mail já está em uso.');
                break;
            case 'auth/weak-password':
                this.showError('A senha é muito fraca. Use pelo menos 6 caracteres.');
                break;
            case 'auth/network-request-failed':
                this.showError('Erro de conexão. Verifique sua internet.');
                break;
            default:
                this.showError('Erro: ' + error.message);
        }
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
        
        document.body.appendChild(notification);

        // Remover após 5 segundos
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    showLogin() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('appContainer').classList.add('hidden');
    }

    showApp() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('appContainer').classList.remove('hidden');
        
        // Atualizar informações do usuário
        if (this.user) {
            document.getElementById('userEmail').textContent = this.user.email;
        }
        
        // Iniciar sincronização automática
        this.iniciarSincronizacaoAutomatica();
    }
}

// Inicializar sistema de autenticação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    window.authSystem = new AuthSystem();
});

// Função global para sair
window.sair = function() {
    if (window.authSystem) {
        window.authSystem.sair();
    }
};

// Função global para salvar dados (para ser chamada de outros arquivos)
window.salvarDadosFirebase = function() {
    if (window.authSystem && window.authSystem.user) {
        window.authSystem.salvarDadosUsuario();
    }
};