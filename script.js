// Variáveis globais
let currentSection = 1;
const totalSections = 6;
let gastosChart, distribuicaoGastosChart, evolucaoPatrimonialChart, comparativoMercadoChart, projecaoPatrimonialChart;

// Dados salvos no localStorage
let dadosUsuario = {
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

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log("Página carregada - Iniciando configuração...");
    
    // Carregar dados do localStorage
    carregarDados();
    
    // Configurar event listeners para os formulários
    document.getElementById('formReceita').addEventListener('submit', salvarReceita);
    document.getElementById('formDespesa').addEventListener('submit', salvarDespesa);
    document.getElementById('formDivida').addEventListener('submit', salvarDivida);
    document.getElementById('formInvestimento').addEventListener('submit', salvarInvestimento);
    document.getElementById('formMeta').addEventListener('submit', function(e) {
        e.preventDefault();
        salvarMeta();
    });
    document.getElementById('formCategoria').addEventListener('submit', function(e) {
        e.preventDefault();
        salvarCategoria();
    });
    
    // Configurar tema
    document.getElementById('themeToggle').addEventListener('click', toggleModoEscuro);
    
    // Aplicar tema salvo
    aplicarTema();
    
    // Definir data padrão para hoje nos modais
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('investimentoData').value = hoje;
    
    // Inicializar histórico se não existir
    if (!dadosUsuario.historicoPatrimonial || dadosUsuario.historicoPatrimonial.length === 0) {
        inicializarHistoricoPatrimonial();
    }
    
    // Inicializar alertas
    verificarAlertas();
    
    // Inicializar analytics
    inicializarAnalytics();
    
    // Carregar conteúdo educativo
    carregarConteudoEducativo();
    
    console.log("Configuração concluída - Dados carregados:", dadosUsuario);
});

// FUNÇÃO: Inicializar histórico patrimonial com dados FIXOS
function inicializarHistoricoPatrimonial() {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'];
    
    // Dados FIXOS que não mudam
    dadosUsuario.historicoPatrimonial = [
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
    document.getElementById('progress').style.width = `${progress}%`;
}

function showSection(sectionNumber) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`section${sectionNumber}`).classList.add('active');
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
    const salario = parseFloat(document.getElementById('salario').value) || 0;
    const salarioSecundario = parseFloat(document.getElementById('salarioSecundario').value) || 0;
    const freelance = parseFloat(document.getElementById('freelance').value) || 0;
    const aluguelRecebido = parseFloat(document.getElementById('aluguelRecebido').value) || 0;
    const outrasReceitas = parseFloat(document.getElementById('outrasReceitas').value) || 0;
    
    const totalReceitas = salario + salarioSecundario + freelance + aluguelRecebido + outrasReceitas;
    document.getElementById('totalReceitas').textContent = `R$ ${totalReceitas.toFixed(2)}`;
    
    // Calcular despesas
    const aluguel = parseFloat(document.getElementById('aluguel').value) || 0;
    const condominio = parseFloat(document.getElementById('condominio').value) || 0;
    const agua = parseFloat(document.getElementById('agua').value) || 0;
    const luz = parseFloat(document.getElementById('luz').value) || 0;
    const internet = parseFloat(document.getElementById('internet').value) || 0;
    const combustivel = parseFloat(document.getElementById('combustivel').value) || 0;
    const transportePublico = parseFloat(document.getElementById('transportePublico').value) || 0;
    
    const totalDespesas = aluguel + condominio + agua + luz + internet + combustivel + transportePublico;
    document.getElementById('totalDespesas').textContent = `R$ ${totalDespesas.toFixed(2)}`;
    
    // Atualizar resumo
    document.getElementById('resumoReceitas').textContent = `R$ ${totalReceitas.toFixed(2)}`;
    document.getElementById('resumoDespesas').textContent = `R$ ${totalDespesas.toFixed(2)}`;
    
    const totalDividas = calcularTotalDividasDashboard();
    document.getElementById('resumoDividas').textContent = `R$ ${totalDividas.toFixed(2)}`;
    
    const totalDisponivel = totalReceitas - totalDespesas - totalDividas;
    document.getElementById('resumoDisponivel').textContent = `R$ ${totalDisponivel.toFixed(2)}`;
    
    const totalInvestido = calcularTotalInvestidoDashboard();
    const valorInvestir = Math.max(0, totalDisponivel);
    document.getElementById('resumoInvestir').textContent = `R$ ${valorInvestir.toFixed(2)}`;
    
    const saldoFinal = totalDisponivel - valorInvestir;
    document.getElementById('resumoSaldo').textContent = `R$ ${saldoFinal.toFixed(2)}`;
    
    // Atualizar cores conforme positivo/negativo
    document.getElementById('resumoDisponivel').className = totalDisponivel >= 0 ? 'summary-value positive' : 'summary-value negative';
    document.getElementById('resumoSaldo').className = saldoFinal >= 0 ? 'summary-value positive' : 'summary-value negative';

    atualizarGraficoGastos();
}

// Funções do Dashboard
function finalizarQuestionario() {
    salvarDadosQuestionario();
    
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    document.getElementById('dashboard').style.display = 'block';
    
    atualizarDashboard();
    criarGraficos();
}

function reiniciarQuestionario() {
    document.getElementById('dashboard').style.display = 'none';
    
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
    
    document.getElementById(tabId).classList.add('active');
    
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Encontrar o botão correto para ativar
    const buttons = document.querySelectorAll('.tab-button');
    for (let i = 0; i < buttons.length; i++) {
        if (buttons[i].textContent.trim() === document.querySelector(`#${tabId} h3`).textContent.trim() || 
            buttons[i].getAttribute('onclick').includes(tabId)) {
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
    
    document.getElementById('dashboardReceitas').textContent = `R$ ${totalReceitas.toFixed(2)}`;
    document.getElementById('dashboardDespesas').textContent = `R$ ${totalDespesas.toFixed(2)}`;
    document.getElementById('dashboardSaldo').textContent = `R$ ${(totalReceitas - totalDespesas - totalDividas).toFixed(2)}`;
    document.getElementById('dashboardInvestimentos').textContent = `R$ ${totalInvestido.toFixed(2)}`;
    
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
    const receitas = dadosUsuario.receitas || [];
    
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
            <td>${receita.descricao}</td>
            <td>R$ ${parseFloat(receita.valor).toFixed(2)}</td>
            <td>${receita.categoria}</td>
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
    const despesas = dadosUsuario.despesas || [];
    
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
            <td>${despesa.descricao}</td>
            <td>R$ ${parseFloat(despesa.valor).toFixed(2)}</td>
            <td>${despesa.categoria}</td>
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
    const dividas = dadosUsuario.dividas || [];
    
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
            <td>${divida.descricao}</td>
            <td>R$ ${parseFloat(divida.valorTotal).toFixed(2)}</td>
            <td>R$ ${parseFloat(divida.valorParcela).toFixed(2)}</td>
            <td>${divida.parcelas}</td>
            <td>${divida.taxaJuros ? divida.taxaJuros + '%' : '-'}</td>
            <td>${divida.status}</td>
            <td>
                <button class="btn" onclick="editarDivida(${index})">Editar</button>
                <button class="btn btn-danger" onclick="excluirDivida(${index})">Excluir</button>
            </td>
        </tr>
    `).join('');
}

function atualizarTabelaInvestimentos() {
    const tbody = document.getElementById('investimentosDashboardTable');
    const investimentos = dadosUsuario.investimentos || [];
    
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
                <td>${investimento.descricao}</td>
                <td>R$ ${valorInvestido.toFixed(2)}</td>
                <td>R$ ${valorAtual.toFixed(2)}</td>
                <td>${investimento.tipo}</td>
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
    const metas = dadosUsuario.metas || [];
    
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
                    <h4>${meta.descricao}</h4>
                    <span class="summary-value">R$ ${valorTotal.toFixed(2)}</span>
                </div>
                <p><strong>Categoria:</strong> ${meta.categoria}</p>
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
    const categorias = dadosUsuario.categorias || [];
    
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
                <div class="categoria-color" style="background-color: ${categoria.cor};"></div>
                <div>
                    <strong>${categoria.nome}</strong>
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
    const receitasQuestionario = dadosUsuario.questionario?.receitas || {};
    const receitasManuais = dadosUsuario.receitas || [];
    
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
    const despesasQuestionario = dadosUsuario.questionario?.despesas || {};
    const despesasManuais = dadosUsuario.despesas || [];
    
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
    return (dadosUsuario.dividas || []).reduce((total, divida) => {
        if (divida.status !== 'Paga') {
            return total + parseFloat(divida.valorParcela || 0);
        }
        return total;
    }, 0);
}

function calcularTotalInvestidoDashboard() {
    return (dadosUsuario.investimentos || []).reduce((total, investimento) => total + parseFloat(investimento.valor || 0), 0);
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
    const investimentos = dadosUsuario.investimentos || [];
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
    document.getElementById('dashboardRendimento').textContent = 
        `Rendimento mensal: R$ ${rendimentoMensal.toFixed(2)}`;
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
    const ctxGastos = document.getElementById('gastosChart').getContext('2d');
    gastosChart = new Chart(ctxGastos, {
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
    
    // Gráfico de Distribuição de Gastos (dashboard)
    const ctxDistribuicao = document.getElementById('distribuicaoGastosChart').getContext('2d');
    distribuicaoGastosChart = new Chart(ctxDistribuicao, {
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
    
    // Gráfico de Evolução Patrimonial (dashboard)
    const ctxEvolucao = document.getElementById('evolucaoPatrimonialChart').getContext('2d');
    
    const historico = dadosUsuario.historicoPatrimonial || [];
    const labels = historico.map(item => item.mes);
    const dados = historico.map(item => item.valor);
    
    evolucaoPatrimonialChart = new Chart(ctxEvolucao, {
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

function atualizarGraficosDashboard() {
    return;
}

function atualizarGraficoGastos() {
}

// Assistente Financeiro
function gerarMensagensAssistente() {
    const mensagensContainer = document.getElementById('assistenteMensagens');
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
    dadosUsuario.metas?.forEach(meta => {
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
    dadosUsuario.alertas = alertas;
    salvarDados();
}

function dismissAlerta(index) {
    dadosUsuario.alertas.splice(index, 1);
    salvarDados();
    verificarAlertas();
}

// Funções dos Modais
function abrirModalReceita(editIndex = null) {
    const modal = document.getElementById('modalReceita');
    const form = document.getElementById('formReceita');
    const titulo = document.getElementById('modalReceitaTitulo');
    
    if (editIndex !== null) {
        titulo.textContent = 'Editar Receita';
        const receita = dadosUsuario.receitas[editIndex];
        document.getElementById('receitaId').value = editIndex;
        document.getElementById('receitaDescricao').value = receita.descricao;
        document.getElementById('receitaValor').value = receita.valor;
        document.getElementById('receitaCategoria').value = receita.categoria;
        document.getElementById('receitaData').value = receita.data;
        document.getElementById('receitaObservacoes').value = receita.observacoes || '';
    } else {
        titulo.textContent = 'Nova Receita';
        form.reset();
        document.getElementById('receitaId').value = '';
        document.getElementById('receitaData').value = new Date().toISOString().split('T')[0];
    }
    
    modal.style.display = 'flex';
}

function abrirModalDespesa(editIndex = null) {
    const modal = document.getElementById('modalDespesa');
    const form = document.getElementById('formDespesa');
    const titulo = document.getElementById('modalDespesaTitulo');
    
    if (editIndex !== null) {
        titulo.textContent = 'Editar Despesa';
        const despesa = dadosUsuario.despesas[editIndex];
        document.getElementById('despesaId').value = editIndex;
        document.getElementById('despesaDescricao').value = despesa.descricao;
        document.getElementById('despesaValor').value = despesa.valor;
        document.getElementById('despesaCategoria').value = despesa.categoria;
        document.getElementById('despesaData').value = despesa.data;
        document.getElementById('despesaRecorrente').checked = despesa.recorrente || false;
        document.getElementById('despesaObservacoes').value = despesa.observacoes || '';
    } else {
        titulo.textContent = 'Nova Despesa';
        form.reset();
        document.getElementById('despesaId').value = '';
        document.getElementById('despesaData').value = new Date().toISOString().split('T')[0];
        document.getElementById('despesaRecorrente').checked = false;
    }
    
    modal.style.display = 'flex';
}

function abrirModalDivida(editIndex = null) {
    const modal = document.getElementById('modalDivida');
    const form = document.getElementById('formDivida');
    const titulo = document.getElementById('modalDividaTitulo');
    
    if (editIndex !== null) {
        titulo.textContent = 'Editar Dívida';
        const divida = dadosUsuario.dividas[editIndex];
        document.getElementById('dividaId').value = editIndex;
        document.getElementById('dividaDescricao').value = divida.descricao;
        document.getElementById('dividaValorTotal').value = divida.valorTotal;
        document.getElementById('dividaValorParcela').value = divida.valorParcela;
        document.getElementById('dividaParcelas').value = divida.parcelas;
        document.getElementById('dividaTaxaJuros').value = divida.taxaJuros || '';
        document.getElementById('dividaStatus').value = divida.status;
        document.getElementById('dividaObservacoes').value = divida.observacoes || '';
    } else {
        titulo.textContent = 'Nova Dívida';
        form.reset();
        document.getElementById('dividaId').value = '';
        document.getElementById('dividaStatus').value = 'Pendente';
    }
    
    modal.style.display = 'flex';
}

function abrirModalInvestimento(editIndex = null) {
    const modal = document.getElementById('modalInvestimento');
    const form = document.getElementById('formInvestimento');
    const titulo = document.getElementById('modalInvestimentoTitulo');
    
    if (editIndex !== null) {
        titulo.textContent = 'Editar Investimento';
        const investimento = dadosUsuario.investimentos[editIndex];
        document.getElementById('investimentoId').value = editIndex;
        document.getElementById('investimentoDescricao').value = investimento.descricao;
        document.getElementById('investimentoValor').value = investimento.valor;
        document.getElementById('investimentoTipo').value = investimento.tipo;
        document.getElementById('investimentoRentabilidade').value = investimento.rentabilidade || '';
        document.getElementById('investimentoData').value = investimento.data;
        document.getElementById('investimentoObservacoes').value = investimento.observacoes || '';
    } else {
        titulo.textContent = 'Novo Investimento';
        form.reset();
        document.getElementById('investimentoId').value = '';
        document.getElementById('investimentoData').value = new Date().toISOString().split('T')[0];
    }
    
    modal.style.display = 'flex';
}

function abrirModalMeta(editIndex = null) {
    console.log("Abrindo modal de meta, editIndex:", editIndex);
    const modal = document.getElementById('modalMeta');
    const form = document.getElementById('formMeta');
    const titulo = document.getElementById('modalMetaTitulo');
    
    if (editIndex !== null) {
        titulo.textContent = 'Editar Meta';
        const meta = dadosUsuario.metas[editIndex];
        document.getElementById('metaId').value = editIndex;
        document.getElementById('metaDescricao').value = meta.descricao;
        document.getElementById('metaValor').value = meta.valor;
        document.getElementById('metaData').value = meta.data;
        document.getElementById('metaCategoria').value = meta.categoria;
        document.getElementById('metaObservacoes').value = meta.observacoes || '';
    } else {
        titulo.textContent = 'Nova Meta';
        form.reset();
        document.getElementById('metaId').value = '';
        document.getElementById('metaData').value = '';
    }
    
    modal.style.display = 'flex';
}

function abrirModalCategoria(editIndex = null) {
    console.log("Abrindo modal de categoria, editIndex:", editIndex);
    const modal = document.getElementById('modalCategoria');
    const form = document.getElementById('formCategoria');
    const titulo = document.getElementById('modalCategoriaTitulo');
    
    if (editIndex !== null) {
        titulo.textContent = 'Editar Categoria';
        const categoria = dadosUsuario.categorias[editIndex];
        document.getElementById('categoriaId').value = editIndex;
        document.getElementById('categoriaNome').value = categoria.nome;
        document.getElementById('categoriaCor').value = categoria.cor;
        document.getElementById('categoriaTipo').value = categoria.tipo;
        document.getElementById('categoriaObservacoes').value = categoria.observacoes || '';
    } else {
        titulo.textContent = 'Nova Categoria';
        form.reset();
        document.getElementById('categoriaId').value = '';
        document.getElementById('categoriaCor').value = '#3498db';
        document.getElementById('categoriaTipo').value = 'receita';
    }
    
    modal.style.display = 'flex';
}

function fecharModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Funções de CRUD
function salvarReceita(e) {
    e.preventDefault();
    
    const id = document.getElementById('receitaId').value;
    const receita = {
        descricao: document.getElementById('receitaDescricao').value,
        valor: parseFloat(document.getElementById('receitaValor').value),
        categoria: document.getElementById('receitaCategoria').value,
        data: document.getElementById('receitaData').value,
        observacoes: document.getElementById('receitaObservacoes').value
    };
    
    if (id === '') {
        dadosUsuario.receitas.push(receita);
    } else {
        dadosUsuario.receitas[id] = receita;
    }
    
    salvarDados();
    fecharModal('modalReceita');
    atualizarDashboard();
}

function salvarDespesa(e) {
    e.preventDefault();
    
    const id = document.getElementById('despesaId').value;
    const despesa = {
        descricao: document.getElementById('despesaDescricao').value,
        valor: parseFloat(document.getElementById('despesaValor').value),
        categoria: document.getElementById('despesaCategoria').value,
        data: document.getElementById('despesaData').value,
        recorrente: document.getElementById('despesaRecorrente').checked,
        observacoes: document.getElementById('despesaObservacoes').value
    };
    
    if (id === '') {
        dadosUsuario.despesas.push(despesa);
    } else {
        dadosUsuario.despesas[id] = despesa;
    }
    
    salvarDados();
    fecharModal('modalDespesa');
    atualizarDashboard();
}

function salvarDivida(e) {
    e.preventDefault();
    
    const id = document.getElementById('dividaId').value;
    const divida = {
        descricao: document.getElementById('dividaDescricao').value,
        valorTotal: parseFloat(document.getElementById('dividaValorTotal').value),
        valorParcela: parseFloat(document.getElementById('dividaValorParcela').value),
        parcelas: document.getElementById('dividaParcelas').value,
        taxaJuros: document.getElementById('dividaTaxaJuros').value ? parseFloat(document.getElementById('dividaTaxaJuros').value) : null,
        status: document.getElementById('dividaStatus').value,
        observacoes: document.getElementById('dividaObservacoes').value
    };
    
    if (id === '') {
        dadosUsuario.dividas.push(divida);
    } else {
        dadosUsuario.dividas[id] = divida;
    }
    
    salvarDados();
    fecharModal('modalDivida');
    atualizarDashboard();
}

function salvarInvestimento(e) {
    e.preventDefault();
    
    const id = document.getElementById('investimentoId').value;
    const investimento = {
        descricao: document.getElementById('investimentoDescricao').value,
        valor: parseFloat(document.getElementById('investimentoValor').value),
        tipo: document.getElementById('investimentoTipo').value,
        rentabilidade: document.getElementById('investimentoRentabilidade').value ? parseFloat(document.getElementById('investimentoRentabilidade').value) : null,
        data: document.getElementById('investimentoData').value,
        observacoes: document.getElementById('investimentoObservacoes').value
    };
    
    if (id === '') {
        dadosUsuario.investimentos.push(investimento);
    } else {
        dadosUsuario.investimentos[id] = investimento;
    }
    
    salvarDados();
    fecharModal('modalInvestimento');
    atualizarDashboard();
}

function salvarMeta() {
    console.log("Salvando meta...");
    
    const id = document.getElementById('metaId').value;
    const meta = {
        descricao: document.getElementById('metaDescricao').value,
        valor: parseFloat(document.getElementById('metaValor').value),
        data: document.getElementById('metaData').value,
        categoria: document.getElementById('metaCategoria').value,
        observacoes: document.getElementById('metaObservacoes').value,
        progresso: 0
    };
    
    console.log("Dados da meta:", meta);
    
    if (id === '') {
        // Nova meta
        dadosUsuario.metas.push(meta);
        console.log("Nova meta adicionada");
    } else {
        // Editar meta existente - manter progresso
        meta.progresso = dadosUsuario.metas[id].progresso || 0;
        dadosUsuario.metas[id] = meta;
        console.log("Meta editada no índice:", id);
    }
    
    salvarDados();
    fecharModal('modalMeta');
    atualizarTabelaMetas();
    
    console.log("Metas após salvar:", dadosUsuario.metas);
}

function salvarCategoria() {
    console.log("Salvando categoria...");
    
    const id = document.getElementById('categoriaId').value;
    const categoria = {
        nome: document.getElementById('categoriaNome').value,
        cor: document.getElementById('categoriaCor').value,
        tipo: document.getElementById('categoriaTipo').value,
        observacoes: document.getElementById('categoriaObservacoes').value
    };
    
    console.log("Dados da categoria:", categoria);
    
    if (id === '') {
        // Nova categoria
        categoria.id = Date.now(); // ID único
        dadosUsuario.categorias.push(categoria);
        console.log("Nova categoria adicionada");
    } else {
        // Editar categoria existente
        dadosUsuario.categorias[id] = categoria;
        console.log("Categoria editada no índice:", id);
    }
    
    salvarDados();
    fecharModal('modalCategoria');
    atualizarTabelaCategorias();
    
    console.log("Categorias após salvar:", dadosUsuario.categorias);
}

// Funções de edição
function editarReceita(index) { abrirModalReceita(index); }
function editarDespesa(index) { abrirModalDespesa(index); }
function editarDivida(index) { abrirModalDivida(index); }
function editarInvestimento(index) { abrirModalInvestimento(index); }
function editarMeta(index) { 
    console.log("Editando meta no índice:", index);
    abrirModalMeta(index); 
}
function editarCategoria(index) { 
    console.log("Editando categoria no índice:", index);
    abrirModalCategoria(index); 
}

// Funções de exclusão
function excluirReceita(index) {
    if (confirm('Tem certeza que deseja excluir esta receita?')) {
        dadosUsuario.receitas.splice(index, 1);
        salvarDados();
        atualizarDashboard();
    }
}

function excluirDespesa(index) {
    if (confirm('Tem certeza que deseja excluir esta despesa?')) {
        dadosUsuario.despesas.splice(index, 1);
        salvarDados();
        atualizarDashboard();
    }
}

function excluirDivida(index) {
    if (confirm('Tem certeza que deseja excluir esta dívida?')) {
        dadosUsuario.dividas.splice(index, 1);
        salvarDados();
        atualizarDashboard();
    }
}

function excluirInvestimento(index) {
    if (confirm('Tem certeza que deseja excluir este investimento?')) {
        dadosUsuario.investimentos.splice(index, 1);
        salvarDados();
        atualizarDashboard();
    }
}

function excluirMeta(index) {
    if (confirm('Tem certeza que deseja excluir esta meta?')) {
        dadosUsuario.metas.splice(index, 1);
        salvarDados();
        atualizarTabelaMetas();
    }
}

function excluirCategoria(index) {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
        dadosUsuario.categorias.splice(index, 1);
        salvarDados();
        atualizarTabelaCategorias();
    }
}

// Funções de Metas
function adicionarProgressoMeta(index) {
    const meta = dadosUsuario.metas[index];
    const novoProgresso = parseFloat(meta.progresso || 0) + 100;
    
    // Não permitir progresso maior que o valor da meta
    meta.progresso = Math.min(novoProgresso, parseFloat(meta.valor));
    
    salvarDados();
    atualizarTabelaMetas();
    
    // Verificar se a meta foi alcançada
    if (meta.progresso >= parseFloat(meta.valor)) {
        alert(`Parabéns! Você alcançou a meta: ${meta.descricao}`);
    }
}

// Modo Escuro
function toggleModoEscuro() {
    console.log("Alternando modo escuro...");
    dadosUsuario.preferencias.modoEscuro = !dadosUsuario.preferencias.modoEscuro;
    salvarDados();
    aplicarTema();
}

function aplicarTema() {
    console.log("Aplicando tema, modo escuro:", dadosUsuario.preferencias.modoEscuro);
    if (dadosUsuario.preferencias.modoEscuro) {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').textContent = '☀️';
        console.log("Modo escuro ativado");
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('themeToggle').textContent = '🌙';
        console.log("Modo claro ativado");
    }
}

// Sistema de Backup
function fazerBackup() {
    const dados = JSON.stringify(dadosUsuario);
    const blob = new Blob([dados], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-financeiro-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    // Atualizar UI
    dadosUsuario.backup.ultimoBackup = new Date().toISOString();
    salvarDados();
    atualizarInfoBackup();
    
    mostrarNotificacao('Backup realizado com sucesso!', 'success');
}

function restaurarBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const dadosRestaurados = JSON.parse(e.target.result);
                dadosUsuario = { ...dadosUsuario, ...dadosRestaurados };
                salvarDados();
                location.reload();
                mostrarNotificacao('Dados restaurados com sucesso!', 'success');
            } catch (error) {
                mostrarNotificacao('Erro ao restaurar backup', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function atualizarInfoBackup() {
    const ultimoBackup = dadosUsuario.backup.ultimoBackup;
    if (ultimoBackup) {
        document.getElementById('ultimoBackup').textContent = new Date(ultimoBackup).toLocaleString('pt-BR');
    } else {
        document.getElementById('ultimoBackup').textContent = 'Nunca';
    }
    
    // Calcular próximo backup (24h após o último)
    if (ultimoBackup) {
        const proximo = new Date(ultimoBackup);
        proximo.setDate(proximo.getDate() + 1);
        document.getElementById('proximoBackup').textContent = proximo.toLocaleString('pt-BR');
    } else {
        document.getElementById('proximoBackup').textContent = '-';
    }
}

// Sistema de Automações
function abrirModalRegra() {
    const html = `
        <div class="modal" id="modalRegra">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Nova Regra de Automação</h3>
                    <button class="close-modal" onclick="fecharModal('modalRegra')">&times;</button>
                </div>
                
                <form id="formRegra">
                    <div class="form-group">
                        <label>Condição</label>
                        <select id="regraCampo">
                            <option value="descricao">Descrição</option>
                            <option value="valor">Valor</option>
                            <option value="data">Data</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Operador</label>
                        <select id="regraOperador">
                            <option value="contem">Contém</option>
                            <option value="igual">É igual a</option>
                            <option value="maior">Maior que</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Valor</label>
                        <input type="text" id="regraValor" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Então categorizar como:</label>
                        <select id="regraCategoria">
                            <option value="Alimentação">Alimentação</option>
                            <option value="Transporte">Transporte</option>
                            <option value="Lazer">Lazer</option>
                            <option value="Saúde">Saúde</option>
                            <option value="Educação">Educação</option>
                        </select>
                    </div>
                    
                    <div class="action-buttons">
                        <button type="button" class="btn btn-secondary" onclick="fecharModal('modalRegra')">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar Regra</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Remover modal existente se houver
    const modalExistente = document.getElementById('modalRegra');
    if (modalExistente) {
        modalExistente.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('modalRegra').style.display = 'flex';
    
    // Adicionar event listener para o formulário
    document.getElementById('formRegra').addEventListener('submit', function(e) {
        e.preventDefault();
        salvarRegra();
    });
}

function salvarRegra() {
    const regra = {
        campo: document.getElementById('regraCampo').value,
        operador: document.getElementById('regraOperador').value,
        valor: document.getElementById('regraValor').value,
        categoria: document.getElementById('regraCategoria').value
    };
    
    dadosUsuario.automações.push(regra);
    salvarDados();
    fecharModal('modalRegra');
    mostrarNotificacao('Regra de automação salva com sucesso!', 'success');
    
    // Atualizar lista de regras
    atualizarListaRegras();
}

function atualizarListaRegras() {
    const container = document.getElementById('automationRules');
    const regras = dadosUsuario.automações || [];
    
    if (regras.length === 0) {
        container.innerHTML = '<div class="empty-state">Nenhuma regra configurada</div>';
        return;
    }
    
    container.innerHTML = regras.map((regra, index) => `
        <div class="rule-item">
            <strong>Se ${regra.campo} ${regra.operador} "${regra.valor}" → Categoria: "${regra.categoria}"</strong>
            <button class="btn btn-danger btn-sm" onclick="excluirRegra(${index})">Remover</button>
        </div>
    `).join('');
}

function excluirRegra(index) {
    if (confirm('Tem certeza que deseja excluir esta regra?')) {
        dadosUsuario.automações.splice(index, 1);
        salvarDados();
        atualizarListaRegras();
    }
}

// Analytics Avançados
function inicializarAnalytics() {
    // KPIs automáticos
    const totalReceitas = calcularTotalReceitas();
    const totalDespesas = calcularTotalDespesas();
    const taxaPoupanca = totalReceitas > 0 ? ((totalReceitas - totalDespesas) / totalReceitas) * 100 : 0;
    
    document.querySelector('#analytics .kpi-grid .stat-card:nth-child(2) .stat-value').textContent = 
        `${taxaPoupanca.toFixed(1)}%`;
    
    // Gráfico comparativo
    const ctxComparativo = document.getElementById('comparativoMercadoChart').getContext('2d');
    if (comparativoMercadoChart) comparativoMercadoChart.destroy();
    
    comparativoMercadoChart = new Chart(ctxComparativo, {
        type: 'bar',
        data: {
            labels: ['Você', 'Média Mercado'],
            datasets: [{
                label: 'Taxa de Poupança (%)',
                data: [taxaPoupanca, 18],
                backgroundColor: ['#2ecc71', '#95a5a6']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Porcentagem (%)'
                    }
                }
            }
        }
    });
    
    // Gráfico de projeção patrimonial
    const ctxProjecao = document.getElementById('projecaoPatrimonialChart').getContext('2d');
    if (projecaoPatrimonialChart) projecaoPatrimonialChart.destroy();
    
    const patrimonioAtual = calcularTotalReceitas() - calcularTotalDespesas();
    const meses = ['Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan'];
    const projecao = [];
    
    for (let i = 0; i < 6; i++) {
        projecao.push(patrimonioAtual * (1 + 0.05 * i)); // Crescimento de 5% ao mês
    }
    
    projecaoPatrimonialChart = new Chart(ctxProjecao, {
        type: 'line',
        data: {
            labels: meses,
            datasets: [{
                label: 'Projeção Patrimonial (R$)',
                data: projecao,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                borderWidth: 3,
                tension: 0.2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Educação Financeira
function carregarConteudoEducativo() {
    const conteudos = [
        {
            titulo: "💰 Como criar uma reserva de emergência",
            tipo: "video",
            duracao: "5 min",
            nivel: "Iniciante"
        },
        {
            titulo: "📈 Entendendo juros compostos",
            tipo: "artigo", 
            duracao: "8 min",
            nivel: "Intermediário"
        },
        {
            titulo: "💳 Como sair das dívidas rapidamente",
            tipo: "video",
            duracao: "10 min",
            nivel: "Iniciante"
        },
        {
            titulo: "📊 Planejamento financeiro familiar",
            tipo: "artigo",
            duracao: "12 min",
            nivel: "Intermediário"
        }
    ];
    
    // Exibir na UI
    const container = document.getElementById('educacaoContainer');
    
    container.innerHTML = conteudos.map(conteudo => `
        <div class="conteudo-educativo">
            <h4>${conteudo.titulo}</h4>
            <div class="conteudo-meta">
                <span class="badge">${conteudo.tipo}</span>
                <span>${conteudo.duracao}</span>
                <span class="nivel ${conteudo.nivel.toLowerCase()}">${conteudo.nivel}</span>
            </div>
            <button class="btn btn-sm" onclick="iniciarConteudo('${conteudo.titulo}')">Começar</button>
        </div>
    `).join('');
}

function iniciarConteudo(titulo) {
    mostrarNotificacao(`Iniciando: ${titulo}`, 'info');
    // Aqui você poderia implementar a lógica para abrir o conteúdo real
}

// Simulador de Metas
function calcularSimulacao() {
    const valor = parseFloat(document.getElementById('simuladorValor').value);
    const prazo = parseInt(document.getElementById('simuladorPrazo').value);
    
    if (valor && prazo) {
        const mensal = valor / prazo;
        document.getElementById('valorMensal').textContent = `R$ ${mensal.toFixed(2)}`;
        
        const recomendacao = mensal > 500 ? 
            "Considere investir parte do valor para alcançar mais rápido" :
            "Valor acessível! Você consegue!";
            
        document.getElementById('recomendacaoSimulacao').textContent = recomendacao;
        document.getElementById('resultadoSimulacao').classList.remove('hidden');
    } else {
        alert('Por favor, preencha todos os campos do simulador.');
    }
}

// Sistema de Notificações
function mostrarNotificacao(mensagem, tipo) {
    const notification = document.createElement('div');
    notification.className = `notification ${tipo}`;
    notification.textContent = mensagem;
    
    document.body.appendChild(notification);
    
    // Remover após 5 segundos
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Relatórios PDF
function gerarRelatorioPDF(tipo = 'completo') {
    // Usando html2canvas e jsPDF para gerar o relatório
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Adicionar título baseado no tipo
    let titulo = 'Relatório Financeiro';
    switch(tipo) {
        case 'mensal':
            titulo = 'Relatório Financeiro Mensal';
            break;
        case 'anual':
            titulo = 'Relatório Financeiro Anual';
            break;
        case 'investimentos':
            titulo = 'Relatório de Investimentos';
            break;
        case 'metas':
            titulo = 'Relatório de Metas Financeiras';
            break;
        default:
            titulo = 'Relatório Financeiro Completo';
    }
    
    doc.setFontSize(20);
    doc.text(titulo, 20, 20);
    
    // Adicionar data
    const hoje = new Date();
    doc.setFontSize(12);
    doc.text(`Gerado em: ${hoje.toLocaleDateString('pt-BR')}`, 20, 30);
    
    // Adicionar resumo financeiro
    doc.setFontSize(16);
    doc.text('Resumo Financeiro', 20, 50);
    
    const totalReceitas = calcularTotalReceitas();
    const totalDespesas = calcularTotalDespesas();
    const totalDividas = calcularTotalDividasDashboard();
    const totalInvestido = calcularTotalInvestidoDashboard();
    const saldo = totalReceitas - totalDespesas - totalDividas;
    
    doc.setFontSize(12);
    doc.text(`Receitas Totais: R$ ${totalReceitas.toFixed(2)}`, 20, 65);
    doc.text(`Despesas Totais: R$ ${totalDespesas.toFixed(2)}`, 20, 75);
    doc.text(`Parcelas de Dívidas: R$ ${totalDividas.toFixed(2)}`, 20, 85);
    doc.text(`Total Investido: R$ ${totalInvestido.toFixed(2)}`, 20, 95);
    doc.text(`Saldo Disponível: R$ ${saldo.toFixed(2)}`, 20, 105);
    
    // Salvar o PDF
    doc.save(`relatorio-${tipo}-${hoje.toISOString().split('T')[0]}.pdf`);
}

// Funções de salvamento e carregamento
function salvarDados() {
    console.log("Salvando dados no localStorage...");
    try {
        localStorage.setItem('planilhaFinanceira', JSON.stringify(dadosUsuario));
        console.log("Dados salvos com sucesso");
    } catch (e) {
        console.error("Erro ao salvar dados:", e);
    }
}

function carregarDados() {
    console.log("Carregando dados do localStorage...");
    try {
        const dadosSalvos = localStorage.getItem('planilhaFinanceira');
        if (dadosSalvos) {
            const dadosParseados = JSON.parse(dadosSalvos);
            // Mesclar dados salvos com estrutura padrão
            dadosUsuario = {
                ...dadosUsuario,
                ...dadosParseados,
                // Garantir que arrays existam
                metas: dadosParseados.metas || [],
                categorias: dadosParseados.categorias || [
                    { id: 1, nome: "Salário", tipo: "receita", cor: "#2ecc71" },
                    { id: 2, nome: "Freelance", tipo: "receita", cor: "#3498db" },
                    { id: 3, nome: "Moradia", tipo: "despesa", cor: "#e74c3c" },
                    { id: 4, nome: "Alimentação", tipo: "despesa", cor: "#f39c12" }
                ],
                preferencias: dadosParseados.preferencias || { modoEscuro: false },
                automações: dadosParseados.automações || [],
                backup: dadosParseados.backup || {
                    ultimoBackup: null,
                    proximoBackup: null
                }
            };
            console.log("Dados carregados com sucesso:", dadosUsuario);
        } else {
            console.log("Nenhum dado salvo encontrado, usando dados padrão");
        }
    } catch (e) {
        console.error("Erro ao carregar dados:", e);
    }
}

function salvarDadosQuestionario() {
    dadosUsuario.questionario = {
        receitas: {
            salario: document.getElementById('salario').value,
            salarioSecundario: document.getElementById('salarioSecundario').value,
            freelance: document.getElementById('freelance').value,
            aluguelRecebido: document.getElementById('aluguelRecebido').value,
            outrasReceitas: document.getElementById('outrasReceitas').value
        },
        despesas: {
            aluguel: document.getElementById('aluguel').value,
            condominio: document.getElementById('condominio').value,
            agua: document.getElementById('agua').value,
            luz: document.getElementById('luz').value,
            internet: document.getElementById('internet').value,
            combustivel: document.getElementById('combustivel').value,
            transportePublico: document.getElementById('transportePublico').value
        }
    };
    salvarDados();
}

function exportarDados() {
    const dataStr = JSON.stringify(dadosUsuario, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'dados-financeiros.json';
    link.click();
}

// Funções utilitárias
function formatarData(dataString) {
    if (!dataString) return '-';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
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
    console.log("Dados atuais:", dadosUsuario);
    return dadosUsuario;
}