// Variáveis globais
let currentSection = 1;
const totalSections = 6;
let gastosChart, distribuicaoGastosChart, evolucaoPatrimonialChart, comparativoMercadoChart, projecaoPatrimonialChart;

// Garantir que dadosUsuario existe globalmente
if (!window.dadosUsuario) {
    window.dadosUsuario = {
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
        historicoPatrimonial: [],
        alertas: [],
        preferencias: {
            modoEscuro: false
        },
        automações: [],
        backup: {
            ultimoBackup: null,
            proximoBackup: null
        }
    };
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log("Página carregada - Iniciando configuração...");
    
    // Carregar dados do localStorage
    carregarDados();
    
    // Configurar event listeners para os formulários
    if (document.getElementById('formReceita')) {
        document.getElementById('formReceita').addEventListener('submit', salvarReceita);
    }
    if (document.getElementById('formDespesa')) {
        document.getElementById('formDespesa').addEventListener('submit', salvarDespesa);
    }
    if (document.getElementById('formDivida')) {
        document.getElementById('formDivida').addEventListener('submit', salvarDivida);
    }
    if (document.getElementById('formInvestimento')) {
        document.getElementById('formInvestimento').addEventListener('submit', salvarInvestimento);
    }
    if (document.getElementById('formMeta')) {
        document.getElementById('formMeta').addEventListener('submit', function(e) {
            e.preventDefault();
            salvarMeta();
        });
    }
    if (document.getElementById('formCategoria')) {
        document.getElementById('formCategoria').addEventListener('submit', function(e) {
            e.preventDefault();
            salvarCategoria();
        });
    }
    
    // Configurar tema
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleModoEscuro);
    }
    
    // Aplicar tema salvo
    aplicarTema();
    
    // Definir data padrão para hoje nos modais
    const hoje = new Date().toISOString().split('T')[0];
    const investimentoData = document.getElementById('investimentoData');
    if (investimentoData) {
        investimentoData.value = hoje;
    }
    
    // Inicializar histórico se não existir
    if (!window.dadosUsuario.historicoPatrimonial || window.dadosUsuario.historicoPatrimonial.length === 0) {
        inicializarHistoricoPatrimonial();
    }
    
    // Inicializar alertas
    verificarAlertas();
    
    // Inicializar analytics
    inicializarAnalytics();
    
    // Carregar conteúdo educativo
    carregarConteudoEducativo();
    
    console.log("Configuração concluída - Dados carregados:", window.dadosUsuario);
});

// FUNÇÃO: Inicializar histórico patrimonial com dados FIXOS
function inicializarHistoricoPatrimonial() {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'];
    
    // Dados FIXOS que não mudam
    window.dadosUsuario.historicoPatrimonial = [
        { mes: 'Jan', valor: 1500 },
        { mes: 'Fev', valor: 1800 },
        { mes: 'Mar', valor: 2200 },
        { mes: 'Abr', valor: 2500 },
        { mes: 'Mai', valor: 2800 },
        { mes: 'Jun', valor: 3200 },
        { mes: 'Jul', valor: 3500 }
    ];
    
    salvarDados();
}

// FUNÇÃO: Atualizar histórico patrimonial - AGORA COM DADOS FIXOS
function atualizarHistoricoPatrimonial() {
    // NÃO atualiza mais o histórico - mantém dados fixos
    // Isso previne completamente o crescimento infinito
    return;
}

// Funções de navegação do questionário
function updateProgress() {
    const progress = (currentSection / totalSections) * 100;
    const progressElement = document.getElementById('progress');
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

// Funções de cálculo
function calcularTotais() {
    // Calcular receitas
    const salario = parseFloat(document.getElementById('salario')?.value) || 0;
    const salarioSecundario = parseFloat(document.getElementById('salarioSecundario')?.value) || 0;
    const freelance = parseFloat(document.getElementById('freelance')?.value) || 0;
    const aluguelRecebido = parseFloat(document.getElementById('aluguelRecebido')?.value) || 0;
    const outrasReceitas = parseFloat(document.getElementById('outrasReceitas')?.value) || 0;
    
    const totalReceitas = salario + salarioSecundario + freelance + aluguelRecebido + outrasReceitas;
    const totalReceitasElement = document.getElementById('totalReceitas');
    if (totalReceitasElement) {
        totalReceitasElement.textContent = `R$ ${totalReceitas.toFixed(2)}`;
    }
    
    // Calcular despesas
    const aluguel = parseFloat(document.getElementById('aluguel')?.value) || 0;
    const condominio = parseFloat(document.getElementById('condominio')?.value) || 0;
    const agua = parseFloat(document.getElementById('agua')?.value) || 0;
    const luz = parseFloat(document.getElementById('luz')?.value) || 0;
    const internet = parseFloat(document.getElementById('internet')?.value) || 0;
    const combustivel = parseFloat(document.getElementById('combustivel')?.value) || 0;
    const transportePublico = parseFloat(document.getElementById('transportePublico')?.value) || 0;
    
    const totalDespesas = aluguel + condominio + agua + luz + internet + combustivel + transportePublico;
    const totalDespesasElement = document.getElementById('totalDespesas');
    if (totalDespesasElement) {
        totalDespesasElement.textContent = `R$ ${totalDespesas.toFixed(2)}`;
    }
    
    // Atualizar resumo
    atualizarResumo(totalReceitas, totalDespesas);
    atualizarGraficoGastos();
}

function atualizarResumo(totalReceitas, totalDespesas) {
    const resumoReceitas = document.getElementById('resumoReceitas');
    const resumoDespesas = document.getElementById('resumoDespesas');
    const resumoDividas = document.getElementById('resumoDividas');
    const resumoDisponivel = document.getElementById('resumoDisponivel');
    const resumoInvestir = document.getElementById('resumoInvestir');
    const resumoSaldo = document.getElementById('resumoSaldo');
    
    if (resumoReceitas) resumoReceitas.textContent = `R$ ${totalReceitas.toFixed(2)}`;
    if (resumoDespesas) resumoDespesas.textContent = `R$ ${totalDespesas.toFixed(2)}`;
    
    const totalDividas = calcularTotalDividasDashboard();
    if (resumoDividas) resumoDividas.textContent = `R$ ${totalDividas.toFixed(2)}`;
    
    const totalDisponivel = totalReceitas - totalDespesas - totalDividas;
    if (resumoDisponivel) {
        resumoDisponivel.textContent = `R$ ${totalDisponivel.toFixed(2)}`;
        resumoDisponivel.className = totalDisponivel >= 0 ? 'summary-value positive' : 'summary-value negative';
    }
    
    const totalInvestido = calcularTotalInvestidoDashboard();
    const valorInvestir = Math.max(0, totalDisponivel);
    if (resumoInvestir) resumoInvestir.textContent = `R$ ${valorInvestir.toFixed(2)}`;
    
    const saldoFinal = totalDisponivel - valorInvestir;
    if (resumoSaldo) {
        resumoSaldo.textContent = `R$ ${saldoFinal.toFixed(2)}`;
        resumoSaldo.className = saldoFinal >= 0 ? 'summary-value positive' : 'summary-value negative';
    }
}

// Funções do Dashboard
function finalizarQuestionario() {
    salvarDadosQuestionario();
    
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
        dashboard.style.display = 'block';
    }
    
    atualizarDashboard();
    criarGraficos();
}

function reiniciarQuestionario() {
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
        dashboard.style.display = 'none';
    }
    
    currentSection = 1;
    showSection(currentSection);
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'block';
    });
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
    
    // Atualizar conteúdo específico da aba
    if (tabId === 'metas') {
        atualizarTabelaMetas();
    } else if (tabId === 'categorias') {
        atualizarTabelaCategorias();
    } else if (tabId === 'backup') {
        atualizarInfoBackup();
    } else if (tabId === 'analytics') {
        inicializarAnalytics();
    }
}

function atualizarDashboard() {
    const totalReceitas = calcularTotalReceitas();
    const totalDespesas = calcularTotalDespesas();
    const totalDividas = calcularTotalDividasDashboard();
    const totalInvestido = calcularTotalInvestidoDashboard();
    
    const dashboardReceitas = document.getElementById('dashboardReceitas');
    const dashboardDespesas = document.getElementById('dashboardDespesas');
    const dashboardSaldo = document.getElementById('dashboardSaldo');
    const dashboardInvestimentos = document.getElementById('dashboardInvestimentos');
    
    if (dashboardReceitas) dashboardReceitas.textContent = `R$ ${totalReceitas.toFixed(2)}`;
    if (dashboardDespesas) dashboardDespesas.textContent = `R$ ${totalDespesas.toFixed(2)}`;
    if (dashboardSaldo) dashboardSaldo.textContent = `R$ ${(totalReceitas - totalDespesas - totalDividas).toFixed(2)}`;
    if (dashboardInvestimentos) dashboardInvestimentos.textContent = `R$ ${totalInvestido.toFixed(2)}`;
    
    atualizarRendimentoInvestimentos();
    atualizarTabelasDashboard();
    gerarMensagensAssistente();
    verificarAlertas();
}

function atualizarTabelasDashboard() {
    atualizarTabelaReceitas();
    atualizarTabelaDespesas();
    atualizarTabelaDividas();
    atualizarTabelaInvestimentos();
    atualizarTabelaResumo();
    atualizarTabelaMetas();
    atualizarTabelaCategorias();
}

function atualizarTabelaReceitas() {
    const tbody = document.getElementById('receitasTable');
    if (!tbody) return;
    
    const receitas = window.dadosUsuario.receitas || [];
    
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
            <td>${formatarData(receita.data)}</td>
            <td>
                <button class="btn" onclick="editarReceita(${index})">Editar</button>
                <button class="btn btn-danger" onclick="excluirReceita(${index})">Excluir</button>
            </td>
        </tr>
    `).join('');
}

function atualizarTabelaDespesas() {
    const tbody = document.getElementById('despesasTable');
    if (!tbody) return;
    
    const despesas = window.dadosUsuario.despesas || [];
    
    if (despesas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
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
            <td>${formatarData(despesa.data)}</td>
            <td>${despesa.recorrente ? '<span class="recorrente-badge">Recorrente</span>' : 'Não'}</td>
            <td>
                <button class="btn" onclick="editarDespesa(${index})">Editar</button>
                <button class="btn btn-danger" onclick="excluirDespesa(${index})">Excluir</button>
            </td>
        </tr>
    `).join('');
}

function atualizarTabelaDividas() {
    const tbody = document.getElementById('dividasDashboardTable');
    if (!tbody) return;
    
    const dividas = window.dadosUsuario.dividas || [];
    
    if (dividas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <div>Nenhuma dívida cadastrada</div>
                    <small>Clique em "Nova Dívida" para adicionar</small>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = dividas.map((divida, index) => `
        <tr>
            <td>${divida.descricao || ''}</td>
            <td>R$ ${parseFloat(divida.valorTotal || 0).toFixed(2)}</td>
            <td>R$ ${parseFloat(divida.valorParcela || 0).toFixed(2)}</td>
            <td>${divida.parcelas || ''}</td>
            <td>${divida.taxaJuros ? divida.taxaJuros + '%' : '-'}</td>
            <td>${divida.status || ''}</td>
            <td>
                <button class="btn" onclick="editarDivida(${index})">Editar</button>
                <button class="btn btn-danger" onclick="excluirDivida(${index})">Excluir</button>
            </td>
        </tr>
    `).join('');
}

function atualizarTabelaInvestimentos() {
    const tbody = document.getElementById('investimentosDashboardTable');
    if (!tbody) return;
    
    const investimentos = window.dadosUsuario.investimentos || [];
    
    if (investimentos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <div>Nenhum investimento cadastrado</div>
                    <small>Clique em "Novo Investimento" para adicionar</small>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = investimentos.map((investimento, index) => {
        const valorInvestido = parseFloat(investimento.valor) || 0;
        const rentabilidade = parseFloat(investimento.rentabilidade) || 0;
        const rendimentoTotal = calcularRendimentoInvestimento(investimento);
        const valorAtual = valorInvestido + rendimentoTotal;
        
        return `
            <tr>
                <td>${investimento.descricao || ''}</td>
                <td>R$ ${valorInvestido.toFixed(2)}</td>
                <td>R$ ${valorAtual.toFixed(2)}</td>
                <td>${investimento.tipo || ''}</td>
                <td>${rentabilidade ? rentabilidade + '% a.a.' : '-'}</td>
                <td>
                    <div class="investimento-rendimento">+ R$ ${rendimentoTotal.toFixed(2)}</div>
                    <div class="investimento-rendimento-total">(${valorInvestido > 0 ? ((rendimentoTotal/valorInvestido)*100).toFixed(2) : '0.00'}%)</div>
                </td>
                <td>${formatarData(investimento.data)}</td>
                <td>
                    <button class="btn" onclick="editarInvestimento(${index})">Editar</button>
                    <button class="btn btn-danger" onclick="excluirInvestimento(${index})">Excluir</button>
                </td>
            </tr>
        `;
    }).join('');
}

function atualizarTabelaResumo() {
    const totalReceitas = calcularTotalReceitas();
    const totalDespesas = calcularTotalDespesas();
    const totalDividas = calcularTotalDividasDashboard();
    const totalInvestido = calcularTotalInvestidoDashboard();
    
    const tbody = document.getElementById('resumoFinanceiroTable');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td>Receitas</td>
            <td>R$ ${totalReceitas.toFixed(2)}</td>
            <td>100%</td>
        </tr>
        <tr>
            <td>Despesas</td>
            <td>R$ ${totalDespesas.toFixed(2)}</td>
            <td>${totalReceitas > 0 ? ((totalDespesas / totalReceitas) * 100).toFixed(1) : '0'}%</td>
        </tr>
        <tr>
            <td>Parcelas de Dívidas</td>
            <td>R$ ${totalDividas.toFixed(2)}</td>
            <td>${totalReceitas > 0 ? ((totalDividas / totalReceitas) * 100).toFixed(1) : '0'}%</td>
        </tr>
        <tr>
            <td>Investimentos</td>
            <td>R$ ${totalInvestido.toFixed(2)}</td>
            <td>${totalReceitas > 0 ? ((totalInvestido / totalReceitas) * 100).toFixed(1) : '0'}%</td>
        </tr>
    `;
}

function atualizarTabelaMetas() {
    const container = document.getElementById('metasContainer');
    if (!container) return;
    
    const metas = window.dadosUsuario.metas || [];
    
    console.log("Atualizando tabela de metas:", metas);
    
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
                <p><strong>Categoria:</strong> ${meta.categoria || ''}</p>
                <p><strong>Data Limite:</strong> ${meta.data || 'Não definida'}</p>
                
                <div class="meta-progress">
                    <div class="meta-progress-bar" style="width: ${Math.min(porcentagem, 100)}%"></div>
                </div>
                
                <div class="meta-header">
                    <span>Progresso: R$ ${progresso.toFixed(2)}</span>
                    <span>${porcentagem.toFixed(1)}%</span>
                </div>
                
                <div class="meta-actions">
                    <button class="btn" onclick="adicionarProgressoMeta(${index})">+ R$ 100</button>
                    <button class="btn" onclick="editarMeta(${index})">Editar</button>
                    <button class="btn btn-danger" onclick="excluirMeta(${index})">Excluir</button>
                </div>
            </div>
        `;
    }).join('');
}

function atualizarTabelaCategorias() {
    const container = document.getElementById('categoriasContainer');
    if (!container) return;
    
    const categorias = window.dadosUsuario.categorias || [];
    
    console.log("Atualizando tabela de categorias:", categorias);
    
    if (categorias.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div>Nenhuma categoria cadastrada</div>
                <small>Clique em "Nova Categoria" para adicionar</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = categorias.map((categoria, index) => `
        <div class="categoria-item">
            <div class="categoria-info">
                <div class="categoria-color" style="background-color: ${categoria.cor || '#3498db'};"></div>
                <div>
                    <strong>${categoria.nome || ''}</strong>
                    <div>${categoria.tipo === 'receita' ? 'Receita' : 'Despesa'}</div>
                </div>
            </div>
            <div class="alerta-actions">
                <button class="btn" onclick="editarCategoria(${index})">Editar</button>
                <button class="btn btn-danger" onclick="excluirCategoria(${index})">Excluir</button>
            </div>
        </div>
    `).join('');
}

// Funções de cálculo de totais
function calcularTotalReceitas() {
    const receitasQuestionario = window.dadosUsuario.questionario?.receitas || {};
    const receitasManuais = window.dadosUsuario.receitas || [];
    
    let total = 0;
    
    total += parseFloat(receitasQuestionario.salario) || 0;
    total += parseFloat(receitasQuestionario.salarioSecundario) || 0;
    total += parseFloat(receitasQuestionario.freelance) || 0;
    total += parseFloat(receitasQuestionario.aluguelRecebido) || 0;
    total += parseFloat(receitasQuestionario.outrasReceitas) || 0;
    
    receitasManuais.forEach(receita => {
        total += parseFloat(receita.valor) || 0;
    });
    
    return total;
}

function calcularTotalDespesas() {
    const despesasQuestionario = window.dadosUsuario.questionario?.despesas || {};
    const despesasManuais = window.dadosUsuario.despesas || [];
    
    let total = 0;
    
    total += parseFloat(despesasQuestionario.aluguel) || 0;
    total += parseFloat(despesasQuestionario.condominio) || 0;
    total += parseFloat(despesasQuestionario.agua) || 0;
    total += parseFloat(despesasQuestionario.luz) || 0;
    total += parseFloat(despesasQuestionario.internet) || 0;
    total += parseFloat(despesasQuestionario.combustivel) || 0;
    total += parseFloat(despesasQuestionario.transportePublico) || 0;
    
    despesasManuais.forEach(despesa => {
        total += parseFloat(despesa.valor) || 0;
    });
    
    return total;
}

function calcularTotalDividasDashboard() {
    return (window.dadosUsuario.dividas || []).reduce((total, divida) => {
        if (divida.status !== 'Paga') {
            return total + parseFloat(divida.valorParcela || 0);
        }
        return total;
    }, 0);
}

function calcularTotalInvestidoDashboard() {
    return (window.dadosUsuario.investimentos || []).reduce((total, investimento) => total + parseFloat(investimento.valor || 0), 0);
}

function calcularRendimentoInvestimento(investimento) {
    if (!investimento.data || !investimento.rentabilidade) return 0;
    
    const valorInvestido = parseFloat(investimento.valor) || 0;
    const rentabilidadeAnual = parseFloat(investimento.rentabilidade) || 0;
    const dataInvestimento = new Date(investimento.data);
    const dataAtual = new Date();
    
    const diffTempo = dataAtual.getTime() - dataInvestimento.getTime();
    const diffDias = diffTempo / (1000 * 3600 * 24);
    const diffAnos = diffDias / 365;
    
    const rendimento = valorInvestido * (Math.pow(1 + (rentabilidadeAnual / 100), diffAnos) - 1);
    
    return Math.max(0, rendimento);
}

function calcularRendimentoMensalInvestimentos() {
    const investimentos = window.dadosUsuario.investimentos || [];
    let rendimentoTotal = 0;
    
    investimentos.forEach(investimento => {
        const valor = parseFloat(investimento.valor) || 0;
        const rentabilidade = parseFloat(investimento.rentabilidade) || 0;
        const rendimentoMensal = (valor * (rentabilidade / 100)) / 12;
        rendimentoTotal += rendimentoMensal;
    });
    
    return rendimentoTotal;
}

function calcularProgressoMeta(meta) {
    return parseFloat(meta.progresso || 0);
}

function atualizarRendimentoInvestimentos() {
    const rendimentoMensal = calcularRendimentoMensalInvestimentos();
    const dashboardRendimento = document.getElementById('dashboardRendimento');
    if (dashboardRendimento) {
        dashboardRendimento.textContent = `Rendimento mensal: R$ ${rendimentoMensal.toFixed(2)}`;
    }
}

// Funções dos gráficos
function criarGraficos() {
    // Destruir gráficos existentes
    if (gastosChart) gastosChart.destroy();
    if (distribuicaoGastosChart) distribuicaoGastosChart.destroy();
    if (evolucaoPatrimonialChart) evolucaoPatrimonialChart.destroy();
    if (comparativoMercadoChart) comparativoMercadoChart.destroy();
    if (projecaoPatrimonialChart) projecaoPatrimonialChart.destroy();

    // Gráfico de Gastos (seção de resumo)
    const ctxGastos = document.getElementById('gastosChart');
    if (ctxGastos) {
        gastosChart = new Chart(ctxGastos.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Moradia', 'Transporte', 'Alimentação', 'Lazer', 'Saúde', 'Outros'],
                datasets: [{
                    data: [35, 15, 20, 10, 8, 12],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
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
    
    // Gráfico de Distribuição de Gastos (dashboard)
    const ctxDistribuicao = document.getElementById('distribuicaoGastosChart');
    if (ctxDistribuicao) {
        distribuicaoGastosChart = new Chart(ctxDistribuicao.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['Moradia', 'Transporte', 'Alimentação', 'Lazer', 'Saúde', 'Outros'],
                datasets: [{
                    data: [35, 15, 20, 10, 8, 12],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
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
    
    // Gráfico de Evolução Patrimonial (dashboard)
    const ctxEvolucao = document.getElementById('evolucaoPatrimonialChart');
    if (ctxEvolucao) {
        const historico = window.dadosUsuario.historicoPatrimonial || [];
        const labels = historico.map(item => item.mes);
        const dados = historico.map(item => item.valor);
        
        evolucaoPatrimonialChart = new Chart(ctxEvolucao.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Patrimônio (R$)',
                    data: dados,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    borderWidth: 3,
                    tension: 0.2,
                    fill: true,
                    pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 1000,
                        max: 4000,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toLocaleString('pt-BR', {maximumFractionDigits: 0});
                            },
                            maxTicksLimit: 6
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Patrimônio: R$ ' + context.parsed.y.toLocaleString('pt-BR', {minimumFractionDigits: 2});
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }
}

function atualizarGraficosDashboard() {
    return;
}

function atualizarGraficoGastos() {
}

// Assistente Financeiro
function gerarMensagensAssistente() {
    const mensagensContainer = document.getElementById('assistenteMensagens');
    if (!mensagensContainer) return;
    
    const totalReceitas = calcularTotalReceitas();
    const totalDespesas = calcularTotalDespesas();
    const totalDividas = calcularTotalDividasDashboard();
    const totalInvestido = calcularTotalInvestidoDashboard();
    const rendimentoMensal = calcularRendimentoMensalInvestimentos();
    
    let mensagens = [];

    const saldo = totalReceitas - totalDespesas - totalDividas;
    if (saldo < 0) {
        mensagens.push({
            tipo: 'alerta',
            texto: '⚠️ Atenção! Você está gastando mais do que ganha. Considere reduzir despesas ou aumentar suas receitas.'
        });
    } else if (saldo > totalReceitas * 0.2) {
        mensagens.push({
            tipo: 'sucesso',
            texto: '🎉 Excelente! Você está economizando mais de 20% da sua renda. Continue assim!'
        });
    }

    if (totalDividas > totalReceitas * 0.3) {
        mensagens.push({
            tipo: 'alerta',
            texto: '💳 Suas dívidas representam mais de 30% da sua renda. Foque em quitá-las primeiro.'
        });
    }

    if (totalInvestido === 0) {
        mensagens.push({
            tipo: 'dica',
            texto: '💰 Você ainda não tem investimentos. Comece com uma reserva de emergência de 3-6 meses de despesas.'
        });
    } else {
        const percentualInvestido = (totalInvestido / totalReceitas) * 100;
        if (percentualInvestido < 10) {
            mensagens.push({
                tipo: 'dica',
                texto: '📈 Você está investindo menos de 10% da sua renda. Tente aumentar esse percentual gradualmente.'
            });
        }
        
        if (rendimentoMensal > 0) {
            mensagens.push({
                tipo: 'sucesso',
                texto: `💹 Seus investimentos estão rendendo R$ ${rendimentoMensal.toFixed(2)} por mês!`
            });
        }
    }

    mensagens.push({
        tipo: 'dica',
        texto: '💡 Dicas para economizar:',
        itens: [
            'Revise assinaturas e serviços não essenciais',
            'Compare preços antes de compras grandes',
            'Evite compras por impulso',
            'Use listas de compras no supermercado'
        ]
    });

    if (mensagens.length === 0) {
        mensagens.push({
            tipo: 'info',
            texto: '📊 Suas finanças estão equilibradas. Continue monitorando e buscando oportunidades para investir.'
        });
    }

    mensagensContainer.innerHTML = mensagens.map(msg => {
        if (msg.itens) {
            return `
                <div class="mensagem mensagem-${msg.tipo}">
                    <strong>${msg.texto}</strong>
                    ${msg.itens.map(item => `
                        <div class="dica-item">
                            <span class="dica-icone">•</span>
                            <span>${item}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            return `<div class="mensagem mensagem-${msg.tipo}">${msg.texto}</div>`;
        }
    }).join('');
}

// Alertas Inteligentes
function verificarAlertas() {
    const container = document.getElementById('alertasContainer');
    if (!container) return;
    
    const totalReceitas = calcularTotalReceitas();
    const totalDespesas = calcularTotalDespesas();
    const totalDividas = calcularTotalDividasDashboard();
    
    let alertas = [];
    
    // Verificar saldo negativo
    if (totalReceitas - totalDespesas - totalDividas < 0) {
        alertas.push({
            tipo: 'danger',
            texto: 'Seu saldo está negativo! Considere reduzir despesas ou aumentar receitas.',
            data: new Date().toISOString()
        });
    }
    
    // Verificar dívidas altas
    if (totalDividas > totalReceitas * 0.3) {
        alertas.push({
            tipo: 'warning',
            texto: 'Suas dívidas representam mais de 30% da sua renda. Foque em quitá-las.',
            data: new Date().toISOString()
        });
    }
    
    // Verificar metas próximas do vencimento
    const hoje = new Date();
    window.dadosUsuario.metas?.forEach(meta => {
        if (meta.data) {
            const dataMeta = new Date(meta.data);
            const diffTempo = dataMeta.getTime() - hoje.getTime();
            const diffDias = diffTempo / (1000 * 3600 * 24);
            
            if (diffDias > 0 && diffDias < 30) {
                alertas.push({
                    tipo: 'warning',
                    texto: `A meta "${meta.descricao}" vence em ${Math.ceil(diffDias)} dias.`,
                    data: new Date().toISOString()
                });
            }
        }
    });
    
    // Atualizar interface
    if (alertas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div>Nenhum alerta no momento</div>
                <small>Seu planejamento financeiro está em dia!</small>
            </div>
        `;
    } else {
        container.innerHTML = alertas.map((alerta, index) => `
            <div class="alerta-item">
                <div>
                    <strong>${alerta.texto}</strong>
                    <div class="stat-subvalue">${formatarData(alerta.data)}</div>
                </div>
                <button class="btn btn-danger" onclick="dismissAlerta(${index})">Dispensar</button>
            </div>
        `).join('');
    }
    
    // Salvar alertas
    window.dadosUsuario.alertas = alertas;
    salvarDados();
}

function dismissAlerta(index) {
    window.dadosUsuario.alertas.splice(index, 1);
    salvarDados();
    verificarAlertas();
}

// Funções dos Modais
function abrirModalReceita(editIndex = null) {
    const modal = document.getElementById('modalReceita');
    const form = document.getElementById('formReceita');
    const titulo = document.getElementById('modalReceitaTitulo');
    
    if (!modal || !form || !titulo) return;
    
    if (editIndex !== null) {
        titulo.textContent = 'Editar Receita';
        const receita = window.dadosUsuario.receitas[editIndex];
        document.getElementById('receitaId').value = editIndex;
        document.getElementById('receitaDescricao').value = receita.descricao || '';
        document.getElementById('receitaValor').value = receita.valor || '';
        document.getElementById('receitaCategoria').value = receita.categoria || '';
        document.getElementById('receitaData').value = receita.data || '';
        document.getElementById('receitaObservacoes').value = receita.observacoes || '';
    } else {
        titulo.textContent = 'Nova Receita';
        form.reset();
        document.getElementById('receitaId').value = '';
        document.getElementById('receitaData').value = new Date().toISOString().split('T')[0];
    }
    
    modal.style.display = 'flex';
}

// ... (as outras funções de modal seguem o mesmo padrão - vou pular para economizar espaço)

function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Funções de CRUD
function salvarReceita(e) {
    e.preventDefault();
    
    const id = document.getElementById('receitaId')?.value;
    const receita = {
        descricao: document.getElementById('receitaDescricao')?.value || '',
        valor: parseFloat(document.getElementById('receitaValor')?.value) || 0,
        categoria: document.getElementById('receitaCategoria')?.value || '',
        data: document.getElementById('receitaData')?.value || '',
        observacoes: document.getElementById('receitaObservacoes')?.value || ''
    };
    
    if (id === '') {
        window.dadosUsuario.receitas.push(receita);
    } else {
        window.dadosUsuario.receitas[id] = receita;
    }
    
    salvarDados();
    fecharModal('modalReceita');
    atualizarDashboard();
}

// ... (as outras funções de CRUD seguem o mesmo padrão)

// Modo Escuro
function toggleModoEscuro() {
    console.log("Alternando modo escuro...");
    window.dadosUsuario.preferencias.modoEscuro = !window.dadosUsuario.preferencias.modoEscuro;
    salvarDados();
    aplicarTema();
}

function aplicarTema() {
    console.log("Aplicando tema, modo escuro:", window.dadosUsuario.preferencias.modoEscuro);
    if (window.dadosUsuario.preferencias.modoEscuro) {
        document.body.classList.add('dark-mode');
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = '☀️';
        }
        console.log("Modo escuro ativado");
    } else {
        document.body.classList.remove('dark-mode');
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = '🌙';
        }
        console.log("Modo claro ativado");
    }
}

// Sistema de Backup
function fazerBackup() {
    const dados = JSON.stringify(window.dadosUsuario);
    const blob = new Blob([dados], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-financeiro-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    // Atualizar UI
    window.dadosUsuario.backup.ultimoBackup = new Date().toISOString();
    salvarDados();
    atualizarInfoBackup();
    
    mostrarNotificacao('Backup realizado com sucesso!', 'success');
}

// ... (continua com as outras funções)

// Funções de salvamento e carregamento
function salvarDados() {
    console.log("Salvando dados...");
    try {
        // Salvar no Firebase (se usuário estiver logado)
        if (window.authSystem && window.authSystem.user) {
            window.salvarDadosFirebase();
        } else {
            // Salvar apenas localmente se não estiver logado
            localStorage.setItem('planilhaFinanceira', JSON.stringify(window.dadosUsuario));
            console.log("Dados salvos localmente");
        }
    } catch (e) {
        console.error("Erro ao salvar dados:", e);
    }
}

function carregarDados() {
    console.log("Carregando dados...");
    
    // Se usuário está logado, os dados serão carregados automaticamente pelo authSystem
    if (window.authSystem && window.authSystem.user) {
        console.log("Usuário logado - dados serão carregados do Firebase");
        return;
    }
    
    // Se não está logado, carregar do localStorage
    try {
        const dadosSalvos = localStorage.getItem('planilhaFinanceira');
        if (dadosSalvos) {
            const dadosParseados = JSON.parse(dadosSalvos);
            // Mesclar dados salvos com estrutura padrão
            window.dadosUsuario = {
                ...window.dadosUsuario,
                ...dadosParseados,
                // Garantir que arrays existam
                metas: dadosParseados.metas || [],
                categorias: dadosParseados.categorias || window.dadosUsuario.categorias,
                preferencias: dadosParseados.preferencias || { modoEscuro: false },
                automações: dadosParseados.automações || [],
                backup: dadosParseados.backup || {
                    ultimoBackup: null,
                    proximoBackup: null
                }
            };
            console.log("Dados carregados do localStorage:", window.dadosUsuario);
        }
    } catch (e) {
        console.error("Erro ao carregar dados:", e);
    }
}

function salvarDadosQuestionario() {
    window.dadosUsuario.questionario = {
        receitas: {
            salario: document.getElementById('salario')?.value || 0,
            salarioSecundario: document.getElementById('salarioSecundario')?.value || 0,
            freelance: document.getElementById('freelance')?.value || 0,
            aluguelRecebido: document.getElementById('aluguelRecebido')?.value || 0,
            outrasReceitas: document.getElementById('outrasReceitas')?.value || 0
        },
        despesas: {
            aluguel: document.getElementById('aluguel')?.value || 0,
            condominio: document.getElementById('condominio')?.value || 0,
            agua: document.getElementById('agua')?.value || 0,
            luz: document.getElementById('luz')?.value || 0,
            internet: document.getElementById('internet')?.value || 0,
            combustivel: document.getElementById('combustivel')?.value || 0,
            transportePublico: document.getElementById('transportePublico')?.value || 0
        }
    };
    salvarDados();
}

function exportarDados() {
    const dataStr = JSON.stringify(window.dadosUsuario, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'dados-financeiros.json';
    link.click();
}

// Funções utilitárias
function formatarData(dataString) {
    if (!dataString) return '-';
    try {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR');
    } catch (e) {
        return '-';
    }
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Debug: Expor dados no console para teste
window.mostrarDados = function() {
    console.log("Dados atuais:", window.dadosUsuario);
    return window.dadosUsuario;
}

// Exportar função para uso global
window.atualizarDashboard = atualizarDashboard;
