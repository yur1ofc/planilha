// Sistema de Autenticação Simplificado
class AuthSystem {
    constructor() {
        this.user = null;
        this.isLoading = false;
        this.init();
    }

    init() {
        console.log("Iniciando sistema de autenticação...");
        
        // Verificar autenticação local primeiro
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            console.log("Usuário encontrado no localStorage");
            this.user = JSON.parse(savedUser);
            return;
        }
    }

    async login(email, password) {
        return true;
    }

    async register(userData) {
        return true;
    }

    async sair() {
        try {
            console.log("Saindo da conta...");
            this.user = null;
        } catch (error) {
            console.error('Erro ao sair:', error);
        }
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
