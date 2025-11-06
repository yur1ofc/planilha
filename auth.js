// Sistema de Autenticação e Sincronização com Firebase
class AuthSystem {
    constructor() {
        this.user = null;
        this.isLoading = false;
        this.init();
    }

    init() {
        console.log("Iniciando sistema de autenticação...");
        this.setupEventListeners();
        
        // Verificar autenticação local primeiro
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            console.log("Usuário encontrado no localStorage");
            this.user = JSON.parse(savedUser);
            this.showApp();
            return;
        }

        this.showLogin();
    }

    setupEventListeners() {
        console.log("Configurando event listeners...");
        
        // Os formulários já são tratados pelo FinancialManager
        // Esta classe agora serve como fallback para Firebase
    }

    async login(email, password) {
        // Esta função será chamada pelo FinancialManager
        // Implementação para compatibilidade
        return true;
    }

    async register(userData) {
        // Esta função será chamada pelo FinancialManager  
        // Implementação para compatibilidade
        return true;
    }

    async sair() {
        try {
            console.log("Saindo da conta...");
            this.user = null;
            this.showLogin();
        } catch (error) {
            console.error('Erro ao sair:', error);
        }
    }

    showLogin() {
        // O FinancialManager já controla a exibição das telas
        console.log("Mostrando tela de login");
    }

    showApp() {
        // O FinancialManager já controla a exibição das telas
        console.log("Mostrando aplicação principal");
    }
}

// Inicializar sistema de autenticação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM carregado, inicializando auth system...");
    window.authSystem = new AuthSystem();
});

// Função global para sair (compatibilidade)
window.sair = function() {
    if (window.financialManager) {
        window.financialManager.logout();
    }
};
