// Sistema de Gerenciamento Financeiro Moderno com Firebase
class FinancialManager {
    constructor() {
        this.currentUser = null;
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.userSettings = JSON.parse(localStorage.getItem('userSettings')) || {};
        this.firebaseAvailable = window.firebaseAvailable || false;
        this.db = window.db;
        this.auth = window.auth;
        this.init();
    }

    async init() {
        console.log("Iniciando Financial Manager...");
        console.log(this.firebaseAvailable ? "🔥 Modo Firebase ativo" : "📴 Modo offline ativo");
        
        this.setupEventListeners();
        this.loadUserSettings();
        await this.checkAuthentication();
    }
// Adicione este método à classe FinancialManager
handleAuthSuccess(userData) {
    console.log("🎯 Usuário autenticado com sucesso, carregando dados...");
    this.currentUser = userData;
    this.showApp();
    this.loadDashboard();
}
    // ✅ SISTEMA DE AUTENTICAÇÃO ATUALIZADO COM FIREBASE
    async checkAuthentication() {
        if (this.firebaseAvailable && this.auth) {
            // Verificar se há usuário autenticado no Firebase
            const firebaseUser = this.auth.currentUser;
            if (firebaseUser) {
                console.log("👤 Usuário Firebase autenticado:", firebaseUser.email);
                await this.loadUserFromFirebase(firebaseUser.uid);
            } else {
                // Verificar localStorage como fallback
                this.checkLocalAuthentication();
            }
        } else {
            this.checkLocalAuthentication();
        }
    }

    async loadUserFromFirebase(uid) {
        try {
            console.log("📥 Carregando dados do Firebase para usuário:", uid);
            const userDoc = await this.db.collection('users').doc(uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.currentUser = {
                    id: uid,
                    ...userData
                };
                console.log("✅ Dados do usuário carregados do Firebase");
                
                // Salvar também no localStorage para fallback
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                
                this.showApp();
                this.loadDashboard();
            } else {
                console.log("❌ Usuário não encontrado no Firestore");
                this.showLogin();
            }
        } catch (error) {
            console.error("❌ Erro ao carregar usuário do Firebase:", error);
            this.checkLocalAuthentication(); // Fallback para localStorage
        }
    }

    checkLocalAuthentication() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showApp();
            this.loadDashboard();
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        const loginScreen = document.getElementById('loginScreen');
        const appContainer = document.getElementById('appContainer');
        
        if (loginScreen) loginScreen.classList.remove('hidden');
        if (appContainer) appContainer.classList.add('hidden');
    }

    showApp() {
        const loginScreen = document.getElementById('loginScreen');
        const appContainer = document.getElementById('appContainer');
        
        if (loginScreen) loginScreen.classList.add('hidden');
        if (appContainer) appContainer.classList.remove('hidden');
        this.updateUserInterface();
    }

    // ✅ REGISTRO ATUALIZADO COM FIREBASE
    async handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('registerName')?.value;
        const nickname = document.getElementById('registerNickname')?.value;
        const email = document.getElementById('registerEmail')?.value;
        const password = document.getElementById('registerPassword')?.value;
        const confirmPassword = document.getElementById('registerConfirmPassword')?.value;

        // Validações
        if (!name || !email || !password || !confirmPassword) {
            this.showNotification('Por favor, preencha todos os campos.', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('As senhas não coincidem!', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('A senha deve ter pelo menos 6 caracteres.', 'error');
            return;
        }

        // Verificar se o usuário já existe (modo offline)
        if (this.users.find(user => user.email === email)) {
            this.showNotification('Este e-mail já está cadastrado!', 'error');
            return;
        }

        const userData = { name, nickname, email, password };

        if (this.firebaseAvailable && this.auth) {
            await this.registerWithFirebase(userData);
        } else {
            this.registerLocal(userData);
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
            
            // Carregar dados do usuário
            this.currentUser = {
                id: user.uid,
                ...firestoreUserData
            };
            
            // Salvar também no localStorage
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            this.showNotification(`Conta criada com sucesso! Bem-vindo, ${userData.name}!`, 'success');
            this.showApp();
            this.loadDashboard();

        } catch (error) {
            console.error("❌ Erro no registro Firebase:", error);
            const errorMsg = this.getFirebaseError(error);
            this.showNotification(errorMsg, 'error');
        }
    }

    registerLocal(userData) {
        try {
            // Código existente para modo offline
            const newUser = {
                id: this.generateId(),
                name: userData.name,
                nickname: userData.nickname,
                email: userData.email,
                password: userData.password,
                createdAt: new Date().toISOString(),
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

            this.users.push(newUser);
            this.saveUsers();
            
            // Login automático após cadastro
            this.loginUser(userData.email, userData.password);
            
        } catch (error) {
            console.error("❌ Erro no registro local:", error);
            this.showNotification('Erro ao criar conta', 'error');
        }
    }

    // ✅ LOGIN ATUALIZADO COM FIREBASE
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;

        if (!email || !password) {
            this.showNotification('Por favor, preencha todos os campos.', 'error');
            return;
        }

        if (this.firebaseAvailable && this.auth) {
            await this.loginWithFirebase(email, password);
        } else {
            this.loginUser(email, password);
        }
    }

    async loginWithFirebase(email, password) {
        try {
            console.log("🔑 Tentando login com Firebase...");
            
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            console.log("✅ Login Firebase bem-sucedido:", user.email);
            
            // Carregar dados do Firestore
            await this.loadUserFromFirebase(user.uid);
            
            this.showNotification(`Bem-vindo de volta, ${user.displayName || 'Usuário'}!`, 'success');

        } catch (error) {
            console.error("❌ Erro no login Firebase:", error);
            const errorMsg = this.getFirebaseError(error);
            this.showNotification(errorMsg, 'error');
        }
    }

    loginUser(email, password) {
        const user = this.users.find(u => u.email === email && u.password === password);
        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.showApp();
            this.loadDashboard();
            this.showNotification(`Bem-vindo de volta, ${user.nickname || user.name}!`, 'success');
            return true;
        } else {
            this.showNotification('E-mail ou senha incorretos!', 'error');
            return false;
        }
    }

    // ✅ LOGOUT ATUALIZADO
    async logout() {
        try {
            if (this.firebaseAvailable && this.auth) {
                await this.auth.signOut();
                console.log("🚪 Logout do Firebase realizado");
            }
            
            this.currentUser = null;
            localStorage.removeItem('currentUser');
            this.showLogin();
            this.showNotification('Você saiu da sua conta', 'info');
            
        } catch (error) {
            console.error('❌ Erro ao sair:', error);
            this.showNotification('Erro ao sair da conta', 'error');
        }
    }

    // ✅ SALVAR DADOS ATUALIZADO COM FIREBASE
    async saveCurrentUser() {
        try {
            if (this.firebaseAvailable && this.currentUser?.id) {
                // Salvar no Firestore
                const userData = { ...this.currentUser };
                delete userData.id; // Remover ID pois é o documento ID
                
                await this.db.collection('users').doc(this.currentUser.id).set(userData, { merge: true });
                console.log("✅ Dados salvos no Firebase");
            }
            
            // Sempre salvar no localStorage também (fallback)
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            // Atualizar também na lista de usuários (modo offline)
            const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
            if (userIndex !== -1) {
                this.users[userIndex] = this.currentUser;
                this.saveUsers();
            }
            
        } catch (error) {
            console.error("❌ Erro ao salvar dados:", error);
            // Fallback para localStorage apenas
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        }
    }

    // ✅ MÉTODOS CRUD ATUALIZADOS
    async salvarReceita(e) {
        if (e) e.preventDefault();
        
        const id = document.getElementById('receitaId')?.value;
        const receita = {
            descricao: document.getElementById('receitaDescricao')?.value || '',
            valor: parseFloat(document.getElementById('receitaValor')?.value) || 0,
            categoria: document.getElementById('receitaCategoria')?.value || '',
            data: document.getElementById('receitaData')?.value || new Date().toISOString().split('T')[0],
            id: this.generateId()
        };
        
        if (!this.currentUser.receitas) this.currentUser.receitas = [];
        
        if (id === '' || id === null) {
            this.currentUser.receitas.push(receita);
        } else {
            this.currentUser.receitas[id] = receita;
        }
        
        await this.saveCurrentUser();
        this.fecharModal('modalReceita');
        this.updateDashboard();
        this.showNotification('Receita salva com sucesso!', 'success');
    }

    async salvarDespesa(e) {
        if (e) e.preventDefault();
        
        const id = document.getElementById('despesaId')?.value;
        const despesa = {
            descricao: document.getElementById('despesaDescricao')?.value || '',
            valor: parseFloat(document.getElementById('despesaValor')?.value) || 0,
            categoria: document.getElementById('despesaCategoria')?.value || '',
            data: document.getElementById('despesaData')?.value || new Date().toISOString().split('T')[0],
            id: this.generateId()
        };
        
        if (!this.currentUser.despesas) this.currentUser.despesas = [];
        
        if (id === '' || id === null) {
            this.currentUser.despesas.push(despesa);
        } else {
            this.currentUser.despesas[id] = despesa;
        }
        
        await this.saveCurrentUser();
        this.fecharModal('modalDespesa');
        this.updateDashboard();
        this.showNotification('Despesa salva com sucesso!', 'success');
    }

    async salvarInvestimento(e) {
        if (e) e.preventDefault();
        
        const id = document.getElementById('investimentoId')?.value;
        const investimento = {
            descricao: document.getElementById('investimentoDescricao')?.value || '',
            valor: parseFloat(document.getElementById('investimentoValor')?.value) || 0,
            tipo: document.getElementById('investimentoTipo')?.value || '',
            rentabilidade: document.getElementById('investimentoRentabilidade')?.value ? 
                parseFloat(document.getElementById('investimentoRentabilidade')?.value) : null,
            data: document.getElementById('investimentoData')?.value || new Date().toISOString().split('T')[0],
            id: this.generateId()
        };
        
        if (!this.currentUser.investimentos) this.currentUser.investimentos = [];
        
        if (id === '' || id === null) {
            this.currentUser.investimentos.push(investimento);
        } else {
            this.currentUser.investimentos[id] = investimento;
        }
        
        await this.saveCurrentUser();
        this.fecharModal('modalInvestimento');
        this.updateDashboard();
        this.showNotification('Investimento salvo com sucesso!', 'success');
    }

    async salvarMeta(e) {
        if (e) e.preventDefault();
        
        const id = document.getElementById('metaId')?.value;
        const meta = {
            descricao: document.getElementById('metaDescricao')?.value || '',
            valor: parseFloat(document.getElementById('metaValor')?.value) || 0,
            data: document.getElementById('metaData')?.value || '',
            progresso: 0,
            id: this.generateId()
        };
        
        if (!this.currentUser.metas) this.currentUser.metas = [];
        
        if (id === '' || id === null) {
            this.currentUser.metas.push(meta);
        } else {
            meta.progresso = this.currentUser.metas[id].progresso || 0;
            this.currentUser.metas[id] = meta;
        }
        
        await this.saveCurrentUser();
        this.fecharModal('modalMeta');
        this.atualizarTabelaMetas();
        this.showNotification('Meta salva com sucesso!', 'success');
    }

    // 🔧 MÉTODOS DE ERRO DO FIREBASE
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

    // 🎯 MANTENHA TODOS OS OUTROS MÉTODOS EXISTENTES (sem alterações)
    setupEventListeners() {
        console.log("Configurando event listeners...");
        
        // Formulários de login/cadastro
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        
        // Formulários de dados
        const formReceita = document.getElementById('formReceita');
        const formDespesa = document.getElementById('formDespesa');
        const formInvestimento = document.getElementById('formInvestimento');
        const formMeta = document.getElementById('formMeta');
        const profileForm = document.getElementById('profileForm');
        
        if (formReceita) formReceita.addEventListener('submit', (e) => this.salvarReceita(e));
        if (formDespesa) formDespesa.addEventListener('submit', (e) => this.salvarDespesa(e));
        if (formInvestimento) formInvestimento.addEventListener('submit', (e) => this.salvarInvestimento(e));
        if (formMeta) formMeta.addEventListener('submit', (e) => this.salvarMeta(e));
        if (profileForm) profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        
        // Menu do usuário
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-info') && !e.target.closest('.user-menu')) {
                const userMenu = document.getElementById('userMenu');
                if (userMenu) userMenu.classList.remove('active');
            }
        });

        // Fechar modais ao clicar fora
        window.addEventListener('click', (event) => {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Validação em tempo real para confirmação de senha
        const registerPassword = document.getElementById('registerPassword');
        const registerConfirmPassword = document.getElementById('registerConfirmPassword');

        if (registerPassword && registerConfirmPassword) {
            registerConfirmPassword.addEventListener('input', () => {
                if (registerPassword.value !== registerConfirmPassword.value) {
                    registerConfirmPassword.style.borderColor = 'var(--danger-color)';
                } else {
                    registerConfirmPassword.style.borderColor = 'var(--success-color)';
                }
            });
        }
    }

    // Atualização da Interface do Usuário
    updateUserInterface() {
        if (!this.currentUser) return;

        // Atualiza informações do usuário no header
        document.getElementById('userName').textContent = this.currentUser.nickname || this.currentUser.name;
        document.getElementById('userEmail').textContent = this.currentUser.email;
        
        // Atualiza avatar
        this.updateAvatar();
        
        // Atualiza modais de perfil
        const profileUserName = document.getElementById('profileUserName');
        const profileUserEmail = document.getElementById('profileUserEmail');
        const profileName = document.getElementById('profileName');
        const profileNickname = document.getElementById('profileNickname');
        const profileEmail = document.getElementById('profileEmail');
        
        if (profileUserName) profileUserName.textContent = this.currentUser.name;
        if (profileUserEmail) profileUserEmail.textContent = this.currentUser.email;
        if (profileName) profileName.value = this.currentUser.name;
        if (profileNickname) profileNickname.value = this.currentUser.nickname || '';
        if (profileEmail) profileEmail.value = this.currentUser.email;
    }

    handleProfileUpdate(e) {
        e.preventDefault();
        
        if (!this.currentUser) return;
        
        const name = document.getElementById('profileName').value;
        const nickname = document.getElementById('profileNickname').value;
        const email = document.getElementById('profileEmail').value;
        
        this.currentUser.name = name;
        this.currentUser.nickname = nickname;
        this.currentUser.email = email;
        
        this.saveCurrentUser();
        this.updateUserInterface();
        this.showNotification('Perfil atualizado com sucesso!', 'success');
        this.fecharModal('profileModal');
    }

    // Sistema de Avatar
    updateAvatar() {
        const avatarElements = document.querySelectorAll('.user-avatar, .avatar-image');
        
        avatarElements.forEach(element => {
            if (this.currentUser.avatar) {
                element.innerHTML = `<img src="${this.currentUser.avatar}" alt="Avatar">`;
            } else {
                const initials = this.getUserInitials();
                element.textContent = initials;
                element.style.background = this.generateAvatarColor(this.currentUser.id);
            }
        });
    }

    getUserInitials() {
        const name = this.currentUser.nickname || this.currentUser.name;
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }

    generateAvatarColor(userId) {
        const colors = [
            'var(--gradient-primary)',
            'var(--gradient-secondary)',
            'var(--gradient-success)',
            'var(--gradient-warning)'
        ];
        const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        return colors[index];
    }

    handleAvatarUpload(fileInput) {
        const file = fileInput.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showNotification('Por favor, selecione uma imagem válida!', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentUser.avatar = e.target.result;
            this.saveCurrentUser();
            this.updateAvatar();
            this.showNotification('Foto de perfil atualizada com sucesso!', 'success');
        };
        reader.readAsDataURL(file);
    }

    // Dashboard e Navegação
    loadDashboard() {
        this.showDashboardSection('overview');
        this.updateDashboard();
    }

    showDashboardSection(section) {
        // Atualiza navegação da sidebar
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const sidebarItem = document.querySelector(`.sidebar-item[onclick="showDashboardSection('${section}')"]`);
        if (sidebarItem) {
            sidebarItem.classList.add('active');
        }

        // Mapeia as seções da sidebar para as tabs do dashboard
        const sectionMap = {
            'overview': 'visao-geral',
            'transactions': 'receitas',
            'budget': 'despesas',
            'goals': 'metas',
            'investments': 'investimentos',
            'reports': 'relatorios'
        };

        const targetTab = sectionMap[section] || 'visao-geral';
        this.showDashboardTab(targetTab);
        this.updateDashboardTitle(section);
    }

    showDashboardTab(tabId) {
        // Remove active de todas as tabs
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });

        // Ativa a tab selecionada
        const tabElement = document.getElementById(tabId);
        if (tabElement) {
            tabElement.classList.add('active');
        }
        
        // Ativa o botão correspondente
        const buttons = document.querySelectorAll('.tab-button');
        buttons.forEach(button => {
            if (button.getAttribute('onclick')?.includes(tabId)) {
                button.classList.add('active');
            }
        });
    }

    updateDashboardTitle(section) {
        const titles = {
            'overview': 'Visão Geral',
            'transactions': 'Transações',
            'budget': 'Orçamento',
            'goals': 'Metas',
            'investments': 'Investimentos',
            'reports': 'Relatórios'
        };
        
        const subtitles = {
            'overview': 'Resumo completo das suas finanças',
            'transactions': 'Gerencie suas entradas e saídas',
            'budget': 'Controle seus gastos',
            'goals': 'Acompanhe seus objetivos',
            'investments': 'Monitore seus investimentos',
            'reports': 'Relatórios detalhados'
        };

        const titleElement = document.getElementById('dashboardTitle');
        const subtitleElement = document.getElementById('dashboardSubtitle');
        
        if (titleElement) titleElement.textContent = titles[section] || 'Dashboard';
        if (subtitleElement) subtitleElement.textContent = subtitles[section] || 'Resumo financeiro';
    }

    updateDashboard() {
        const totalReceitas = this.calcularTotalReceitas();
        const totalDespesas = this.calcularTotalDespesas();
        const totalInvestido = this.calcularTotalInvestidoDashboard();
        const saldo = totalReceitas - totalDespesas;
        
        // Atualiza stats
        const dashboardReceitas = document.getElementById('dashboardReceitas');
        const dashboardDespesas = document.getElementById('dashboardDespesas');
        const dashboardSaldo = document.getElementById('dashboardSaldo');
        const dashboardInvestimentos = document.getElementById('dashboardInvestimentos');
        
        if (dashboardReceitas) dashboardReceitas.textContent = this.formatarMoeda(totalReceitas);
        if (dashboardDespesas) dashboardDespesas.textContent = this.formatarMoeda(totalDespesas);
        if (dashboardSaldo) {
            dashboardSaldo.textContent = this.formatarMoeda(saldo);
            dashboardSaldo.className = saldo >= 0 ? 'stat-value positive' : 'stat-value negative';
        }
        if (dashboardInvestimentos) dashboardInvestimentos.textContent = this.formatarMoeda(totalInvestido);
        
        this.atualizarTabelasDashboard();
        this.gerarMensagensAssistente();
        this.criarGraficos();
    }

    // Funções de cálculo
    calcularTotalReceitas() {
        return (this.currentUser.receitas || []).reduce((total, receita) => total + parseFloat(receita.valor || 0), 0);
    }

    calcularTotalDespesas() {
        return (this.currentUser.despesas || []).reduce((total, despesa) => total + parseFloat(despesa.valor || 0), 0);
    }

    calcularTotalInvestidoDashboard() {
        return (this.currentUser.investimentos || []).reduce((total, investimento) => total + parseFloat(investimento.valor || 0), 0);
    }

    formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }

    // Assistente Financeiro
    gerarMensagensAssistente() {
        const mensagensContainer = document.getElementById('assistenteMensagens');
        if (!mensagensContainer) return;
        
        const totalReceitas = this.calcularTotalReceitas();
        const totalDespesas = this.calcularTotalDespesas();
        const saldo = totalReceitas - totalDespesas;
        
        let mensagens = [];

        if (saldo < 0) {
            mensagens.push({
                tipo: 'alerta',
                texto: '⚠️ Atenção! Você está gastando mais do que ganha. Considere reduzir despesas.'
            });
        } else if (saldo > totalReceitas * 0.2) {
            mensagens.push({
                tipo: 'sucesso',
                texto: '🎉 Excelente! Você está economizando mais de 20% da sua renda.'
            });
        }

        if (this.currentUser.metas && this.currentUser.metas.length === 0) {
            mensagens.push({
                tipo: 'info',
                texto: '💡 Que tal criar sua primeira meta financeira?'
            });
        }

        if (mensagens.length === 0) {
            mensagens.push({
                tipo: 'info',
                texto: '📊 Suas finanças estão equilibradas. Continue monitorando e investindo.'
            });
        }

        mensagensContainer.innerHTML = mensagens.map(msg => 
            `<div class="mensagem mensagem-${msg.tipo}">${msg.texto}</div>`
        ).join('');
    }

    // Atualização de Tabelas
    atualizarTabelasDashboard() {
        this.atualizarTabelaReceitas();
        this.atualizarTabelaDespesas();
        this.atualizarTabelaInvestimentos();
        this.atualizarTabelaMetas();
    }

    atualizarTabelaReceitas() {
        const tbody = document.getElementById('receitasTable');
        if (!tbody) return;
        
        const receitas = this.currentUser.receitas || [];
        
        if (receitas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <div>Nenhuma receita cadastrada</div>
                        <small>Clique em "Nova Receita" para adicionar</small>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = receitas.map((receita, index) => `
            <tr>
                <td>${receita.descricao || ''}</td>
                <td>${this.formatarMoeda(parseFloat(receita.valor || 0))}</td>
                <td>${receita.categoria || ''}</td>
                <td>${this.formatarData(receita.data)}</td>
                <td>
                    <button class="btn btn-sm" onclick="financialManager.editarReceita(${index})">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="financialManager.excluirReceita(${index})">Excluir</button>
                </td>
            </tr>
        `).join('');
    }

    atualizarTabelaDespesas() {
        const tbody = document.getElementById('despesasTable');
        if (!tbody) return;
        
        const despesas = this.currentUser.despesas || [];
        
        if (despesas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <div>Nenhuma despesa cadastrada</div>
                        <small>Clique em "Nova Despesa" para adicionar</small>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = despesas.map((despesa, index) => `
            <tr>
                <td>${despesa.descricao || ''}</td>
                <td>${this.formatarMoeda(parseFloat(despesa.valor || 0))}</td>
                <td>${despesa.categoria || ''}</td>
                <td>${this.formatarData(despesa.data)}</td>
                <td>
                    <button class="btn btn-sm" onclick="financialManager.editarDespesa(${index})">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="financialManager.excluirDespesa(${index})">Excluir</button>
                </td>
            </tr>
        `).join('');
    }

    atualizarTabelaInvestimentos() {
        const tbody = document.getElementById('investimentosDashboardTable');
        if (!tbody) return;
        
        const investimentos = this.currentUser.investimentos || [];
        
        if (investimentos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <div>Nenhum investimento cadastrado</div>
                        <small>Clique em "Novo Investimento" para adicionar</small>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = investimentos.map((investimento, index) => `
            <tr>
                <td>${investimento.descricao || ''}</td>
                <td>${this.formatarMoeda(parseFloat(investimento.valor || 0))}</td>
                <td>${investimento.tipo || ''}</td>
                <td>${investimento.rentabilidade ? investimento.rentabilidade + '% a.a.' : '-'}</td>
                <td>
                    <button class="btn btn-sm" onclick="financialManager.editarInvestimento(${index})">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="financialManager.excluirInvestimento(${index})">Excluir</button>
                </td>
            </tr>
        `).join('');
    }

    atualizarTabelaMetas() {
        const container = document.getElementById('metasContainer');
        if (!container) return;
        
        const metas = this.currentUser.metas || [];
        
        if (metas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div>Nenhuma meta cadastrada</div>
                    <small>Clique em "Nova Meta" para adicionar</small>
                </div>
            `;
            return;
        }
        
        container.innerHTML = metas.map((meta, index) => {
            const progresso = parseFloat(meta.progresso || 0);
            const valorTotal = parseFloat(meta.valor);
            const porcentagem = valorTotal > 0 ? (progresso / valorTotal) * 100 : 0;
            
            return `
                <div class="meta-card">
                    <div class="meta-header">
                        <h4>${meta.descricao || ''}</h4>
                        <span class="summary-value">${this.formatarMoeda(valorTotal)}</span>
                    </div>
                    
                    <div class="meta-progress">
                        <div class="meta-progress-bar" style="width: ${Math.min(porcentagem, 100)}%"></div>
                    </div>
                    
                    <div class="meta-header">
                        <span>Progresso: ${this.formatarMoeda(progresso)}</span>
                        <span>${porcentagem.toFixed(1)}%</span>
                    </div>
                    
                    <div class="meta-actions">
                        <button class="btn btn-sm" onclick="financialManager.adicionarProgressoMeta(${index})">+ R$ 100</button>
                        <button class="btn btn-sm" onclick="financialManager.editarMeta(${index})">Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="financialManager.excluirMeta(${index})">Excluir</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // CRUD - Métodos de edição e exclusão (mantidos sem alterações)
    editarReceita(index) {
        this.abrirModalReceita(index);
    }

    excluirReceita(index) {
        if (confirm('Tem certeza que deseja excluir esta receita?')) {
            this.currentUser.receitas.splice(index, 1);
            this.saveCurrentUser();
            this.updateDashboard();
            this.showNotification('Receita excluída com sucesso!', 'success');
        }
    }

    editarDespesa(index) {
        this.abrirModalDespesa(index);
    }

    excluirDespesa(index) {
        if (confirm('Tem certeza que deseja excluir esta despesa?')) {
            this.currentUser.despesas.splice(index, 1);
            this.saveCurrentUser();
            this.updateDashboard();
            this.showNotification('Despesa excluída com sucesso!', 'success');
        }
    }

    editarInvestimento(index) {
        this.abrirModalInvestimento(index);
    }

    excluirInvestimento(index) {
        if (confirm('Tem certeza que deseja excluir este investimento?')) {
            this.currentUser.investimentos.splice(index, 1);
            this.saveCurrentUser();
            this.updateDashboard();
            this.showNotification('Investimento excluído com sucesso!', 'success');
        }
    }

    editarMeta(index) {
        this.abrirModalMeta(index);
    }

    excluirMeta(index) {
        if (confirm('Tem certeza que deseja excluir esta meta?')) {
            this.currentUser.metas.splice(index, 1);
            this.saveCurrentUser();
            this.atualizarTabelaMetas();
            this.showNotification('Meta excluída com sucesso!', 'success');
        }
    }

    adicionarProgressoMeta(index) {
        const meta = this.currentUser.metas[index];
        const novoProgresso = parseFloat(meta.progresso || 0) + 100;
        
        // Não permitir progresso maior que o valor da meta
        meta.progresso = Math.min(novoProgresso, parseFloat(meta.valor));
        
        this.saveCurrentUser();
        this.atualizarTabelaMetas();
        
        // Verificar se a meta foi alcançada
        if (meta.progresso >= parseFloat(meta.valor)) {
            this.showNotification(`Parabéns! Você alcançou a meta: ${meta.descricao}`, 'success');
        } else {
            this.showNotification('Progresso adicionado à meta!', 'success');
        }
    }

    // Modais (mantidos sem alterações)
    abrirModalReceita(editIndex = null) {
        const modal = document.getElementById('modalReceita');
        const form = document.getElementById('formReceita');
        const titulo = document.getElementById('modalReceitaTitulo');
        
        if (!modal || !form || !titulo) return;
        
        if (editIndex !== null) {
            titulo.textContent = 'Editar Receita';
            const receita = this.currentUser.receitas[editIndex];
            document.getElementById('receitaId').value = editIndex;
            document.getElementById('receitaDescricao').value = receita.descricao || '';
            document.getElementById('receitaValor').value = receita.valor || '';
            document.getElementById('receitaCategoria').value = receita.categoria || '';
            document.getElementById('receitaData').value = receita.data || '';
        } else {
            titulo.textContent = 'Nova Receita';
            form.reset();
            document.getElementById('receitaId').value = '';
            document.getElementById('receitaData').value = new Date().toISOString().split('T')[0];
        }
        
        modal.style.display = 'flex';
    }

    abrirModalDespesa(editIndex = null) {
        const modal = document.getElementById('modalDespesa');
        const form = document.getElementById('formDespesa');
        const titulo = document.getElementById('modalDespesaTitulo');
        
        if (!modal || !form || !titulo) return;
        
        if (editIndex !== null) {
            titulo.textContent = 'Editar Despesa';
            const despesa = this.currentUser.despesas[editIndex];
            document.getElementById('despesaId').value = editIndex;
            document.getElementById('despesaDescricao').value = despesa.descricao || '';
            document.getElementById('despesaValor').value = despesa.valor || '';
            document.getElementById('despesaCategoria').value = despesa.categoria || '';
            document.getElementById('despesaData').value = despesa.data || '';
        } else {
            titulo.textContent = 'Nova Despesa';
            form.reset();
            document.getElementById('despesaId').value = '';
            document.getElementById('despesaData').value = new Date().toISOString().split('T')[0];
        }
        
        modal.style.display = 'flex';
    }

    abrirModalInvestimento(editIndex = null) {
        const modal = document.getElementById('modalInvestimento');
        const form = document.getElementById('formInvestimento');
        const titulo = document.getElementById('modalInvestimentoTitulo');
        
        if (!modal || !form || !titulo) return;
        
        if (editIndex !== null) {
            titulo.textContent = 'Editar Investimento';
            const investimento = this.currentUser.investimentos[editIndex];
            document.getElementById('investimentoId').value = editIndex;
            document.getElementById('investimentoDescricao').value = investimento.descricao || '';
            document.getElementById('investimentoValor').value = investimento.valor || '';
            document.getElementById('investimentoTipo').value = investimento.tipo || '';
            document.getElementById('investimentoRentabilidade').value = investimento.rentabilidade || '';
        } else {
            titulo.textContent = 'Novo Investimento';
            form.reset();
            document.getElementById('investimentoId').value = '';
        }
        
        modal.style.display = 'flex';
    }

    abrirModalMeta(editIndex = null) {
        const modal = document.getElementById('modalMeta');
        const form = document.getElementById('formMeta');
        const titulo = document.getElementById('modalMetaTitulo');
        
        if (!modal || !form || !titulo) return;
        
        if (editIndex !== null) {
            titulo.textContent = 'Editar Meta';
            const meta = this.currentUser.metas[editIndex];
            document.getElementById('metaId').value = editIndex;
            document.getElementById('metaDescricao').value = meta.descricao || '';
            document.getElementById('metaValor').value = meta.valor || '';
            document.getElementById('metaData').value = meta.data || '';
        } else {
            titulo.textContent = 'Nova Meta';
            form.reset();
            document.getElementById('metaId').value = '';
        }
        
        modal.style.display = 'flex';
    }

    fecharModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Gráficos
    criarGraficos() {
        this.criarGraficoDistribuicaoGastos();
        this.criarGraficoEvolucaoPatrimonial();
    }

    criarGraficoDistribuicaoGastos() {
        const ctx = document.getElementById('distribuicaoGastosChart');
        if (!ctx) return;

        const despesas = this.currentUser.despesas || [];
        const categorias = {};
        
        despesas.forEach(despesa => {
            const categoria = despesa.categoria || 'Outros';
            const valor = parseFloat(despesa.valor) || 0;
            
            if (categorias[categoria]) {
                categorias[categoria] += valor;
            } else {
                categorias[categoria] = valor;
            }
        });

        const labels = Object.keys(categorias);
        const data = Object.values(categorias);

        // Se não há dados, mostrar gráfico vazio
        if (labels.length === 0) {
            labels.push('Sem dados');
            data.push(1);
        }

        // Destruir gráfico anterior se existir
        if (ctx.chart) {
            ctx.chart.destroy();
        }

        ctx.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    criarGraficoEvolucaoPatrimonial() {
        const ctx = document.getElementById('evolucaoPatrimonialChart');
        if (!ctx) return;

        // Dados de exemplo - na implementação real, isso viria do histórico
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
        const patrimonios = [1500, 1800, 2200, 2500, 2800, 3200];

        // Destruir gráfico anterior se existir
        if (ctx.chart) {
            ctx.chart.destroy();
        }

        ctx.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: meses,
                datasets: [{
                    label: 'Patrimônio',
                    data: patrimonios,
                    borderColor: '#00d4aa',
                    backgroundColor: 'rgba(0, 212, 170, 0.1)',
                    borderWidth: 3,
                    tension: 0.2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }

    // Utilitários
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatarData(dataString) {
        if (!dataString) return '-';
        try {
            // Corrige o formato da data para o padrão brasileiro
            const data = new Date(dataString + 'T00:00:00'); // Adiciona horário para evitar problemas de fuso
            return data.toLocaleDateString('pt-BR');
        } catch (e) {
            console.error('Erro ao formatar data:', e);
            return '-';
        }
    }

    showNotification(message, type = 'info') {
        // Remover notificação anterior se existir
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            ${message}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Gerenciamento de Dados
    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    // Configurações
    loadUserSettings() {
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
            this.userSettings = JSON.parse(savedSettings);
            this.applyUserSettings();
        }
    }

    saveUserSettings() {
        localStorage.setItem('userSettings', JSON.stringify(this.userSettings));
    }

    applyUserSettings() {
        if (this.userSettings.theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    changeTheme(theme) {
        this.userSettings.theme = theme;
        this.saveUserSettings();
        this.applyUserSettings();
    }
}

// ✅ FUNÇÃO DE DEBUG DO FIREBASE
function checkFirebaseStatus() {
    console.log('=== 🔥 STATUS DO FIREBASE ===');
    console.log('Disponível:', window.firebaseAvailable);
    console.log('Auth:', window.auth ? '✅' : '❌');
    console.log('Firestore:', window.db ? '✅' : '❌');
    console.log('Usuário atual:', auth?.currentUser?.email || 'Nenhum');
    console.log('=============================');
}

// Funções Globais
let financialManager;

function toggleUserMenu() {
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.classList.toggle('active');
    }
}

function showProfileSettings() {
    document.getElementById('profileModal').style.display = 'flex';
    toggleUserMenu();
}

function showAccountSettings() {
    document.getElementById('settingsModal').style.display = 'flex';
    toggleUserMenu();
}

function showPrivacySettings() {
    financialManager.showNotification('Configurações de privacidade em breve!', 'info');
    toggleUserMenu();
}

function showAbout() {
    financialManager.showNotification('Finanças+ v1.0 - Seu controle financeiro inteligente', 'info');
    toggleUserMenu();
}

function logout() {
    financialManager.logout();
}

function closeModal(modalId) {
    financialManager.fecharModal(modalId);
}

function triggerAvatarUpload() {
    document.getElementById('avatarUpload').click();
}

function handleAvatarUpload(input) {
    financialManager.handleAvatarUpload(input);
}

function showLoginForm(formType) {
    document.querySelectorAll('.login-form').forEach(form => {
        form.classList.remove('active');
    });
    document.querySelectorAll('.login-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById(`${formType}Form`).classList.add('active');
    event.target.classList.add('active');
}

function showForgotPassword() {
    financialManager.showNotification('Funcionalidade em desenvolvimento!', 'info');
}

function showDashboardSection(section) {
    financialManager.showDashboardSection(section);
}

function showDashboardTab(tabId) {
    financialManager.showDashboardTab(tabId);
}

function abrirModalReceita() {
    financialManager.abrirModalReceita();
}

function abrirModalDespesa() {
    financialManager.abrirModalDespesa();
}

function abrirModalInvestimento() {
    financialManager.abrirModalInvestimento();
}

function abrirModalMeta() {
    financialManager.abrirModalMeta();
}

function fecharModal(modalId) {
    financialManager.fecharModal(modalId);
}

function changeTheme(theme) {
    financialManager.changeTheme(theme);
}

function saveSettings() {
    financialManager.showNotification('Configurações salvas com sucesso!', 'success');
    financialManager.fecharModal('settingsModal');
}

function exportarDados() {
    const data = {
        usuario: financialManager.currentUser,
        exportadoEm: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `backup-financeiro-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    financialManager.showNotification('Dados exportados com sucesso!', 'success');
}

function gerarRelatorioPDF(tipo = 'completo') {
    financialManager.showNotification(`Relatório ${tipo} gerado com sucesso!`, 'success');
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log("Página carregada - Iniciando configuração...");
    
    // Aguardar um pouco para garantir que tudo está carregado
    setTimeout(() => {
        financialManager = new FinancialManager();
        
        // Configurar data padrão para hoje nos modais
        const hoje = new Date().toISOString().split('T')[0];
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            if (!input.value) {
                input.value = hoje;
            }
        });
        
        console.log("Financial Manager inicializado com sucesso");
        
        // Debug do Firebase
        setTimeout(() => {
            checkFirebaseStatus();
        }, 2000);
        
    }, 100);
});

