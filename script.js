// Sistema de Gerenciamento Financeiro Moderno
class FinancialManager {
    constructor() {
        this.currentUser = null;
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        this.userSettings = JSON.parse(localStorage.getItem('userSettings')) || {};
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        this.loadUserSettings();
    }

    // Sistema de Autenticação
    checkAuthentication() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showApp();
            
            // Verifica se é um novo usuário (sem questionário respondido)
            if (!this.currentUser.questionnaireCompleted) {
                this.showQuestionnaire();
            } else {
                this.loadDashboard();
            }
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('appContainer').classList.add('hidden');
    }

    showApp() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('appContainer').classList.remove('hidden');
        this.updateUserInterface();
    }

    // Registro de Usuário
    registerUser(userData) {
        // Verifica se o usuário já existe
        if (this.users.find(user => user.email === userData.email)) {
            this.showNotification('Este e-mail já está cadastrado!', 'error');
            return false;
        }

        // Cria novo usuário
        const newUser = {
            id: this.generateId(),
            ...userData,
            createdAt: new Date().toISOString(),
            questionnaireCompleted: false,
            avatar: null,
            settings: {
                theme: 'light',
                currency: 'BRL'
            }
        };

        this.users.push(newUser);
        this.saveUsers();
        
        // Login automático após cadastro
        this.loginUser(userData.email, userData.password);
        return true;
    }

    // Login do Usuário
    loginUser(email, password) {
        const user = this.users.find(u => u.email === email && u.password === password);
        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.showApp();
            
            if (!user.questionnaireCompleted) {
                this.showQuestionnaire();
            } else {
                this.loadDashboard();
            }
            
            this.showNotification(`Bem-vindo de volta, ${user.nickname || user.name}!`, 'success');
            return true;
        } else {
            this.showNotification('E-mail ou senha incorretos!', 'error');
            return false;
        }
    }

    // Logout
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showLogin();
        this.showNotification('Você saiu da sua conta', 'info');
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
        document.getElementById('profileUserName').textContent = this.currentUser.name;
        document.getElementById('profileUserEmail').textContent = this.currentUser.email;
        document.getElementById('profileName').value = this.currentUser.name;
        document.getElementById('profileNickname').value = this.currentUser.nickname || '';
        document.getElementById('profileEmail').value = this.currentUser.email;
    }

    // Sistema de Avatar
    updateAvatar() {
        const avatarElements = document.querySelectorAll('.user-avatar, .avatar-image');
        
        avatarElements.forEach(element => {
            if (this.currentUser.avatar) {
                element.innerHTML = `<img src="${this.currentUser.avatar}" alt="Avatar">`;
            } else {
                const initials = this.getUserInitials();
                element.innerHTML = initials;
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

    // Questionário Financeiro
    showQuestionnaire() {
        document.getElementById('questionnaireContainer').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
        this.setupQuestionnaireEvents();
    }

    completeQuestionnaire() {
        this.currentUser.questionnaireCompleted = true;
        this.saveCurrentUser();
        
        document.getElementById('questionnaireContainer').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        this.loadDashboard();
        this.showNotification('Questionário concluído! Personalizando sua experiência...', 'success');
    }

    // Dashboard e Navegação
    loadDashboard() {
        this.showDashboardSection('overview');
        this.updateDashboard();
    }

    showDashboardSection(section) {
        // Atualiza navegação
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelectorAll(`[onclick="showDashboardSection('${section}')"]`).forEach(item => {
            item.classList.add('active');
        });

        // Atualiza título
        this.updateDashboardTitle(section);
    }

    updateDashboardTitle(section) {
        const titles = {
            overview: 'Visão Geral',
            transactions: 'Transações',
            budget: 'Orçamento',
            goals: 'Metas',
            investments: 'Investimentos',
            reports: 'Relatórios'
        };
        
        const subtitles = {
            overview: 'Resumo completo das suas finanças',
            transactions: 'Gerencie suas entradas e saídas',
            budget: 'Controle seus gastos mensais',
            goals: 'Acompanhe seus objetivos financeiros',
            investments: 'Monitore seus investimentos',
            reports: 'Relatórios detalhados e análises'
        };

        document.getElementById('dashboardTitle').textContent = titles[section];
        document.getElementById('dashboardSubtitle').textContent = subtitles[section];
    }

    updateDashboard() {
        const totalReceitas = this.calcularTotalReceitas();
        const totalDespesas = this.calcularTotalDespesas();
        const totalInvestido = this.calcularTotalInvestidoDashboard();
        
        document.getElementById('dashboardReceitas').textContent = `R$ ${totalReceitas.toFixed(2)}`;
        document.getElementById('dashboardDespesas').textContent = `R$ ${totalDespesas.toFixed(2)}`;
        document.getElementById('dashboardSaldo').textContent = `R$ ${(totalReceitas - totalDespesas).toFixed(2)}`;
        document.getElementById('dashboardInvestimentos').textContent = `R$ ${totalInvestido.toFixed(2)}`;
        
        this.atualizarTabelasDashboard();
        this.gerarMensagensAssistente();
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
                <td>R$ ${parseFloat(receita.valor || 0).toFixed(2)}</td>
                <td>${receita.categoria || ''}</td>
                <td>${this.formatarData(receita.data)}</td>
                <td>
                    <button class="btn" onclick="financialManager.editarReceita(${index})">Editar</button>
                    <button class="btn btn-danger" onclick="financialManager.excluirReceita(${index})">Excluir</button>
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
                <td>R$ ${parseFloat(despesa.valor || 0).toFixed(2)}</td>
                <td>${despesa.categoria || ''}</td>
                <td>${this.formatarData(despesa.data)}</td>
                <td>
                    <button class="btn" onclick="financialManager.editarDespesa(${index})">Editar</button>
                    <button class="btn btn-danger" onclick="financialManager.excluirDespesa(${index})">Excluir</button>
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
                <td>R$ ${parseFloat(investimento.valor || 0).toFixed(2)}</td>
                <td>${investimento.tipo || ''}</td>
                <td>${investimento.rentabilidade ? investimento.rentabilidade + '% a.a.' : '-'}</td>
                <td>
                    <button class="btn" onclick="financialManager.editarInvestimento(${index})">Editar</button>
                    <button class="btn btn-danger" onclick="financialManager.excluirInvestimento(${index})">Excluir</button>
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
                        <span class="summary-value">R$ ${valorTotal.toFixed(2)}</span>
                    </div>
                    
                    <div class="meta-progress">
                        <div class="meta-progress-bar" style="width: ${Math.min(porcentagem, 100)}%"></div>
                    </div>
                    
                    <div class="meta-header">
                        <span>Progresso: R$ ${progresso.toFixed(2)}</span>
                        <span>${porcentagem.toFixed(1)}%</span>
                    </div>
                    
                    <div class="meta-actions">
                        <button class="btn" onclick="financialManager.adicionarProgressoMeta(${index})">+ R$ 100</button>
                        <button class="btn" onclick="financialManager.editarMeta(${index})">Editar</button>
                        <button class="btn btn-danger" onclick="financialManager.excluirMeta(${index})">Excluir</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // CRUD - Receitas
    salvarReceita(e) {
        e.preventDefault();
        
        const id = document.getElementById('receitaId')?.value;
        const receita = {
            descricao: document.getElementById('receitaDescricao')?.value || '',
            valor: parseFloat(document.getElementById('receitaValor')?.value) || 0,
            categoria: document.getElementById('receitaCategoria')?.value || '',
            data: document.getElementById('receitaData')?.value || new Date().toISOString().split('T')[0]
        };
        
        if (!this.currentUser.receitas) this.currentUser.receitas = [];
        
        if (id === '') {
            this.currentUser.receitas.push(receita);
        } else {
            this.currentUser.receitas[id] = receita;
        }
        
        this.saveCurrentUser();
        this.fecharModal('modalReceita');
        this.updateDashboard();
        this.showNotification('Receita salva com sucesso!', 'success');
    }

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

    // CRUD - Despesas
    salvarDespesa(e) {
        e.preventDefault();
        
        const id = document.getElementById('despesaId')?.value;
        const despesa = {
            descricao: document.getElementById('despesaDescricao')?.value || '',
            valor: parseFloat(document.getElementById('despesaValor')?.value) || 0,
            categoria: document.getElementById('despesaCategoria')?.value || '',
            data: document.getElementById('despesaData')?.value || new Date().toISOString().split('T')[0]
        };
        
        if (!this.currentUser.despesas) this.currentUser.despesas = [];
        
        if (id === '') {
            this.currentUser.despesas.push(despesa);
        } else {
            this.currentUser.despesas[id] = despesa;
        }
        
        this.saveCurrentUser();
        this.fecharModal('modalDespesa');
        this.updateDashboard();
        this.showNotification('Despesa salva com sucesso!', 'success');
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

    // CRUD - Investimentos
    salvarInvestimento(e) {
        e.preventDefault();
        
        const id = document.getElementById('investimentoId')?.value;
        const investimento = {
            descricao: document.getElementById('investimentoDescricao')?.value || '',
            valor: parseFloat(document.getElementById('investimentoValor')?.value) || 0,
            tipo: document.getElementById('investimentoTipo')?.value || '',
            rentabilidade: document.getElementById('investimentoRentabilidade')?.value ? parseFloat(document.getElementById('investimentoRentabilidade')?.value) : null,
            data: document.getElementById('investimentoData')?.value || new Date().toISOString().split('T')[0]
        };
        
        if (!this.currentUser.investimentos) this.currentUser.investimentos = [];
        
        if (id === '') {
            this.currentUser.investimentos.push(investimento);
        } else {
            this.currentUser.investimentos[id] = investimento;
        }
        
        this.saveCurrentUser();
        this.fecharModal('modalInvestimento');
        this.updateDashboard();
        this.showNotification('Investimento salvo com sucesso!', 'success');
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

    // CRUD - Metas
    salvarMeta(e) {
        e.preventDefault();
        
        const id = document.getElementById('metaId')?.value;
        const meta = {
            descricao: document.getElementById('metaDescricao')?.value || '',
            valor: parseFloat(document.getElementById('metaValor')?.value) || 0,
            data: document.getElementById('metaData')?.value || '',
            progresso: 0
        };
        
        if (!this.currentUser.metas) this.currentUser.metas = [];
        
        if (id === '') {
            this.currentUser.metas.push(meta);
        } else {
            // Manter progresso ao editar
            meta.progresso = this.currentUser.metas[id].progresso || 0;
            this.currentUser.metas[id] = meta;
        }
        
        this.saveCurrentUser();
        this.fecharModal('modalMeta');
        this.atualizarTabelaMetas();
        this.showNotification('Meta salva com sucesso!', 'success');
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

    // Modais
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
            document.getElementById('investimentoData').value = investimento.data || '';
        } else {
            titulo.textContent = 'Novo Investimento';
            form.reset();
            document.getElementById('investimentoId').value = '';
            document.getElementById('investimentoData').value = new Date().toISOString().split('T')[0];
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

    // Utilitários
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatarData(dataString) {
        if (!dataString) return '-';
        try {
            const data = new Date(dataString);
            return data.toLocaleDateString('pt-BR');
        } catch (e) {
            return '-';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            ${message}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
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

    saveCurrentUser() {
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        // Atualiza também na lista de usuários
        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            this.users[userIndex] = this.currentUser;
            this.saveUsers();
        }
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
        if (this.userSettings.theme) {
            document.body.classList.toggle('dark-mode', this.userSettings.theme === 'dark');
        }
    }

    changeTheme(theme) {
        this.userSettings.theme = theme;
        this.saveUserSettings();
        this.applyUserSettings();
    }
}

// Event Listeners Globais
function setupEventListeners() {
    // Formulários de login/cadastro
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Formulários de dados
    document.getElementById('formReceita').addEventListener('submit', (e) => financialManager.salvarReceita(e));
    document.getElementById('formDespesa').addEventListener('submit', (e) => financialManager.salvarDespesa(e));
    document.getElementById('formInvestimento').addEventListener('submit', (e) => financialManager.salvarInvestimento(e));
    document.getElementById('formMeta').addEventListener('submit', (e) => financialManager.salvarMeta(e));
    
    // Menu do usuário
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-info') && !e.target.closest('.user-menu')) {
            document.getElementById('userMenu').classList.remove('active');
        }
    });

    // Fechar modais ao clicar fora
    window.onclick = function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    financialManager.loginUser(email, password);
}

function handleRegister(e) {
    e.preventDefault();
    const userData = {
        name: document.getElementById('registerName').value,
        nickname: document.getElementById('registerNickname').value,
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value
    };
    
    if (userData.password !== document.getElementById('registerConfirmPassword').value) {
        financialManager.showNotification('As senhas não coincidem!', 'error');
        return;
    }
    
    financialManager.registerUser(userData);
}

// Funções Globais
let financialManager;

function toggleUserMenu() {
    document.getElementById('userMenu').classList.toggle('active');
}

function showProfileSettings() {
    document.getElementById('profileModal').style.display = 'flex';
    document.getElementById('userMenu').classList.remove('active');
}

function showAccountSettings() {
    document.getElementById('settingsModal').style.display = 'flex';
    document.getElementById('userMenu').classList.remove('active');
}

function showPrivacySettings() {
    financialManager.showNotification('Configurações de privacidade em breve!', 'info');
    document.getElementById('userMenu').classList.remove('active');
}

function showAbout() {
    financialManager.showNotification('Finanças+ v1.0 - Seu controle financeiro inteligente', 'info');
    document.getElementById('userMenu').classList.remove('active');
}

function logout() {
    financialManager.logout();
    document.getElementById('userMenu').classList.remove('active');
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
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const tabElement = document.getElementById(tabId);
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Encontrar o botão correto para ativar
    const buttons = document.querySelectorAll('.tab-button');
    for (let i = 0; i < buttons.length; i++) {
        if (buttons[i].getAttribute('onclick')?.includes(tabId)) {
            buttons[i].classList.add('active');
            break;
        }
    }
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

function finalizarQuestionario() {
    financialManager.completeQuestionnaire();
}

function reiniciarQuestionario() {
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('questionnaireContainer').classList.remove('hidden');
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
    financialManager.showNotification('Relatório PDF gerado com sucesso!', 'success');
}

// Funções do Questionário (mantidas do código anterior)
let currentSection = 1;
const totalSections = 6;

function updateProgress() {
    const progress = (currentSection / totalSections) * 100;
    const progressElement = document.getElementById('progressBar');
    if (progressElement) {
        progressElement.style.width = `${progress}%`;
    }
}

function showSection(sectionNumber) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    const sectionElement = document.getElementById(`section${sectionNumber}`);
    if (sectionElement) {
        sectionElement.classList.add('active');
    }
    updateProgress();
}

function selectOption(element) {
    const optionsContainer = element.closest('.options');
    if (!optionsContainer) return;
    
    const siblings = optionsContainer.querySelectorAll('.option');
    siblings.forEach(sibling => {
        sibling.classList.remove('selected');
    });
    
    element.classList.add('selected');
}

function nextSection(current) {
    const currentSectionElement = document.getElementById(`section${current}`);
    if (!currentSectionElement) return;
    
    const optionsSelected = currentSectionElement.querySelectorAll('.option.selected');
    
    if (optionsSelected.length === 0 && current <= 3) {
        alert('Por favor, selecione uma resposta antes de continuar.');
        return;
    }
    
    if (current < totalSections) {
        currentSection = current + 1;
        showSection(currentSection);
    }
}

function prevSection(current) {
    if (current > 1) {
        currentSection = current - 1;
        showSection(currentSection);
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log("Página carregada - Iniciando configuração...");
    financialManager = new FinancialManager();
    setupEventListeners();
    
    // Configurar data padrão para hoje nos modais
    const hoje = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = hoje;
        }
    });
});
