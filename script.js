// Sistema de Gerenciamento Financeiro Moderno
class FinancialManager {
    constructor() {
        this.currentUser = null;
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.userSettings = JSON.parse(localStorage.getItem('userSettings')) || {};
        this.init();
    }

    init() {
        console.log("Iniciando Financial Manager...");
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

    // Questionário Financeiro
    showQuestionnaire() {
        document.getElementById('questionnaireContainer').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
        this.setupQuestionnaireEvents();
    }

    setupQuestionnaireEvents() {
        // Configurar eventos para as opções do questionário
        document.querySelectorAll('.option').forEach(option => {
            option.addEventListener('click', function() {
                const optionsContainer = this.closest('.options');
                if (!optionsContainer) return;
                
                const siblings = optionsContainer.querySelectorAll('.option');
                siblings.forEach(sibling => {
                    sibling.classList.remove('selected');
                });
                
                this.classList.add('selected');
            });
        });
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
        // Atualiza navegação da sidebar
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const sidebarItem = document.querySelector(`[onclick="showDashboardSection('${section}')"]`);
        if (sidebarItem) {
            sidebarItem.classList.add('active');
        }

        // Atualiza título
        this.updateDashboardTitle(section);
        
        // Atualiza conteúdo da seção
        document.querySelectorAll('.dashboard-section').forEach(sec => {
            sec.classList.remove('active');
        });
        
        const sectionElement = document.getElementById(section);
        if (sectionElement) {
            sectionElement.classList.add('active');
        }
    }

    updateDashboardTitle(section) {
        const titles = {
            'visao-geral': 'Visão Geral',
            'receitas': 'Receitas',
            'despesas': 'Despesas',
            'investimentos': 'Investimentos',
            'metas': 'Metas',
            'relatorios': 'Relatórios'
        };
        
        const subtitles = {
            'visao-geral': 'Resumo completo das suas finanças',
            'receitas': 'Gerencie suas entradas',
            'despesas': 'Controle seus gastos',
            'investimentos': 'Monitore seus investimentos',
            'metas': 'Acompanhe seus objetivos',
            'relatorios': 'Relatórios detalhados'
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

    // CRUD - Receitas
    salvarReceita(e) {
        if (e) e.preventDefault();
        
        const id = document.getElementById('receitaId')?.value;
        const receita = {
            descricao: document.getElementById('receitaDescricao')?.value || '',
            valor: parseFloat(document.getElementById('receitaValor')?.value) || 0,
            categoria: document.getElementById('receitaCategoria')?.value || '',
            data: document.getElementById('receitaData')?.value || new Date().toISOString().split('T')[0]
        };
        
        if (!this.currentUser.receitas) this.currentUser.receitas = [];
        
        if (id === '' || id === null) {
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
        if (e) e.preventDefault();
        
        const id = document.getElementById('despesaId')?.value;
        const despesa = {
            descricao: document.getElementById('despesaDescricao')?.value || '',
            valor: parseFloat(document.getElementById('despesaValor')?.value) || 0,
            categoria: document.getElementById('despesaCategoria')?.value || '',
            data: document.getElementById('despesaData')?.value || new Date().toISOString().split('T')[0]
        };
        
        if (!this.currentUser.despesas) this.currentUser.despesas = [];
        
        if (id === '' || id === null) {
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
        if (e) e.preventDefault();
        
        const id = document.getElementById('investimentoId')?.value;
        const investimento = {
            descricao: document.getElementById('investimentoDescricao')?.value || '',
            valor: parseFloat(document.getElementById('investimentoValor')?.value) || 0,
            tipo: document.getElementById('investimentoTipo')?.value || '',
            rentabilidade: document.getElementById('investimentoRentabilidade')?.value ? parseFloat(document.getElementById('investimentoRentabilidade')?.value) : null,
            data: document.getElementById('investimentoData')?.value || new Date().toISOString().split('T')[0]
        };
        
        if (!this.currentUser.investimentos) this.currentUser.investimentos = [];
        
        if (id === '' || id === null) {
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
        if (e) e.preventDefault();
        
        const id = document.getElementById('metaId')?.value;
        const meta = {
            descricao: document.getElementById('metaDescricao')?.value || '',
            valor: parseFloat(document.getElementById('metaValor')?.value) || 0,
            data: document.getElementById('metaData')?.value || '',
            progresso: 0
        };
        
        if (!this.currentUser.metas) this.currentUser.metas = [];
        
        if (id === '' || id === null) {
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

        new Chart(ctx, {
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

        new Chart(ctx, {
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
            const data = new Date(dataString);
            return data.toLocaleDateString('pt-BR');
        } catch (e) {
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

// Event Listeners Globais
function setupEventListeners() {
    // Formulários de login/cadastro
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Formulários de dados
    const formReceita = document.getElementById('formReceita');
    const formDespesa = document.getElementById('formDespesa');
    const formInvestimento = document.getElementById('formInvestimento');
    const formMeta = document.getElementById('formMeta');
    const profileForm = document.getElementById('profileForm');
    
    if (formReceita) formReceita.addEventListener('submit', (e) => financialManager.salvarReceita(e));
    if (formDespesa) formDespesa.addEventListener('submit', (e) => financialManager.salvarDespesa(e));
    if (formInvestimento) formInvestimento.addEventListener('submit', (e) => financialManager.salvarInvestimento(e));
    if (formMeta) formMeta.addEventListener('submit', (e) => financialManager.salvarMeta(e));
    if (profileForm) profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        financialManager.showNotification('Perfil atualizado com sucesso!', 'success');
        financialManager.fecharModal('profileModal');
    });
    
    // Menu do usuário
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-info') && !e.target.closest('.user-menu')) {
            const userMenu = document.getElementById('userMenu');
            if (userMenu) userMenu.classList.remove('active');
        }
    });

    // Fechar modais ao clicar fora
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
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
    financialManager.showNotification(`Relatório ${tipo} gerado com sucesso!`, 'success');
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
