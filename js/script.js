/**
 * SISTEMA DE VIAGENS DA IGREJA — script.js
 * Contém toda a lógica de: login, cadastro, pagamento, regras,
 * confirmação, painel do viajante, painel do administrador,
 * mapa de assentos e mapa de quartos.
 */

/* ============================================================
   ESTADO GLOBAL DA APLICAÇÃO
   Centraliza todos os dados persistentes em memória
   ============================================================ */
const AppState = {
  /** Usuário logado atualmente: { cpf, role: 'traveler'|'admin', data: {...} } */
  currentUser: null,

  /** Banco de dados de viajantes (simulado em memória) */
  travelers: [
    {
      cpf: '111.111.111-11', nome: 'Maria Silva', email: 'maria@email.com',
      telefone: '(11) 99999-0001', idade: 'maior', alergia: 'nao', alergiaDesc: '',
      transporte: 'onibus', familia: 'Família Silva', parentesco: 'conjuge',
      senha: 'viagem123', payStatus: 'pago', payMethod: 'pix',
      seat: '01', andar: 'Piso Superior', quarto: '101', tipoQuarto: 'Duplo'
    },
    {
      cpf: '222.222.222-22', nome: 'João Silva', email: 'joao@email.com',
      telefone: '(11) 99999-0002', idade: 'maior', alergia: 'sim', alergiaDesc: 'Alergia a amendoim',
      transporte: 'onibus', familia: 'Família Silva', parentesco: 'conjuge',
      senha: 'viagem123', payStatus: 'pago', payMethod: 'pix',
      seat: '02', andar: 'Piso Superior', quarto: '101', tipoQuarto: 'Duplo'
    },
    {
      cpf: '333.333.333-33', nome: 'Ana Oliveira', email: 'ana@email.com',
      telefone: '(11) 99999-0003', idade: 'maior', alergia: 'nao', alergiaDesc: '',
      transporte: 'proprio', familia: 'Família Oliveira', parentesco: 'pai',
      senha: 'viagem123', payStatus: 'pendente', payMethod: 'boleto',
      seat: null, andar: null, quarto: '102', tipoQuarto: 'Single'
    },
    {
      cpf: '444.444.444-44', nome: 'Lucas Mendes', email: 'lucas@email.com',
      telefone: '(11) 99999-0004', idade: 'menor', nascimento: '2012-06-15',
      responsavelCPF: '111.111.111-11', alergia: 'nao', alergiaDesc: '',
      transporte: 'onibus', familia: 'Família Silva', parentesco: 'filho',
      senha: 'viagem123', payStatus: 'analise', payMethod: 'pix',
      seat: 'B2', andar: 'Piso Superior', quarto: null, tipoQuarto: null
    },
    {
      cpf: '555.555.555-55', nome: 'Fernanda Costa', email: 'fernanda@email.com',
      telefone: '(11) 99999-0005', idade: 'maior', alergia: 'sim', alergiaDesc: 'Necessita cadeira de rodas',
      transporte: 'onibus', familia: 'Família Costa', parentesco: 'pai',
      senha: 'viagem123', payStatus: 'desistiu', payMethod: 'boleto',
      seat: null, andar: null, quarto: null, tipoQuarto: null
    },
  ],

  /** Mapa de assentos do ônibus — dois andares, numerados conforme layout da imagem */
  busSeats: {
    1: {}, // andar 1 (Piso Superior): assentos 01–44
    2: {}  // andar 2 (Piso Inferior): assentos 45–56
  },

  /** Mapa de apartamentos do hotel */
  hotelRooms: [
    { id: '101', tipo: 'Duplo Standard', capacidade: 2, ocupantes: ['111.111.111-11', '222.222.222-22'] },
    { id: '102', tipo: 'Single',         capacidade: 1, ocupantes: ['333.333.333-33'] },
    { id: '103', tipo: 'Triplo',         capacidade: 3, ocupantes: [] },
    { id: '104', tipo: 'Duplo Luxo',     capacidade: 2, ocupantes: [] },
    { id: '105', tipo: 'Quádruplo',      capacidade: 4, ocupantes: [] },
    { id: '106', tipo: 'Single',         capacidade: 1, ocupantes: [] },
    { id: '107', tipo: 'Duplo Standard', capacidade: 2, ocupantes: [] },
    { id: '108', tipo: 'Triplo',         capacidade: 3, ocupantes: [] },
    { id: '201', tipo: 'Suíte Dupla',    capacidade: 2, ocupantes: [] },
    { id: '202', tipo: 'Quádruplo',      capacidade: 4, ocupantes: [] },
    { id: '203', tipo: 'Triplo',         capacidade: 3, ocupantes: [] },
    { id: '204', tipo: 'Duplo Standard', capacidade: 2, ocupantes: [] },
  ],

  /** Viajante temporário durante o fluxo de cadastro */
  newTraveler: null,

  /** Filtro atual da tabela de pagamentos */
  paymentFilter: 'todos',

  /** Referências aos gráficos Chart.js para re-renderização */
  charts: {}
};

/* ============================================================
   INICIALIZAÇÃO DA APLICAÇÃO
   ============================================================ */

/** Quando o DOM estiver pronto, inicializa tudo */
document.addEventListener('DOMContentLoaded', () => {
  // Remove o loading overlay após 1.2s
  setTimeout(() => {
    document.getElementById('loadingOverlay').classList.add('hidden');
  }, 1200);

  // Inicializa os dados do mapa do ônibus a partir dos viajantes cadastrados
  initBusSeatsFromTravelers();

  // Configura formatação automática de CPF nos campos de input
  setupCPFMasks();

  // Configura formatação de telefone
  setupPhoneMask();

  // Configura os formulários de login
  setupLoginForms();

  // Configura o formulário de cadastro de viajante
  setupRegisterForm();

  // Configura alternância de campos condicionais (menor/maior, alergia)
  setupConditionalFields();

  // Configura a navegação da sidebar do admin
  setupAdminNav();
});

/** Pré-popula o mapa de assentos com os viajantes já alocados */
function initBusSeatsFromTravelers() {
  AppState.travelers.forEach(t => {
    if (t.seat && t.andar) {
      // Identifica o andar: 'Piso Superior' = 1, 'Piso Inferior' = 2
      const floorNum = t.andar.includes('Superior') || t.andar.includes('1') ? 1 : 2;
      AppState.busSeats[floorNum][t.seat] = t.cpf;
    }
  });
}

/* ============================================================
   UTILITÁRIOS GERAIS
   ============================================================ */

/**
 * Navega para uma tela específica pelo seu ID.
 * Remove 'active' de todas as telas e adiciona na tela alvo.
 * @param {string} screenId — ID da tela de destino
 */
function goTo(screenId) {
  // Desativa todas as telas
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  // Ativa a tela solicitada
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    // Rola para o topo sempre que trocar de tela
    window.scrollTo(0, 0);
  }
}

/**
 * Exibe uma notificação toast temporária
 * @param {string} msg — Mensagem a ser exibida
 * @param {'success'|'error'} type — Tipo da notificação
 */
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toastNotif');
  const msgEl = document.getElementById('toastMsg');
  const icon  = toast.querySelector('i');

  msgEl.textContent = msg;
  icon.className = type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark';
  icon.style.color = type === 'success' ? '#22c55e' : '#ef4444';

  toast.classList.remove('hidden');
  // Oculta automaticamente após 3 segundos
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

/**
 * Alterna visibilidade de campo de senha (olho aberto/fechado)
 * @param {string} inputId — ID do input de senha
 */
function togglePass(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

/**
 * Formata string como CPF: 000.000.000-00
 * @param {string} value — valor bruto
 * @returns {string} CPF formatado
 */
function formatCPF(value) {
  return value.replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/** Configura máscara de CPF em todos os campos com ID que contenha 'CPF' */
function setupCPFMasks() {
  document.querySelectorAll('[id*="CPF"], [id*="Cpf"], [id*="cpf"]').forEach(input => {
    input.addEventListener('input', e => {
      e.target.value = formatCPF(e.target.value);
    });
  });
}

/** Configura máscara de telefone: (00) 00000-0000 */
function setupPhoneMask() {
  const tel = document.getElementById('regTelefone');
  if (!tel) return;
  tel.addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
  });
}

/** Busca um viajante pelo CPF (exato) */
function findTravelerByCPF(cpf) {
  return AppState.travelers.find(t => t.cpf === cpf) || null;
}

/* ============================================================
   LOGIN E AUTENTICAÇÃO
   ============================================================ */

/** Configura os dois formulários de login (viajante e admin) */
function setupLoginForms() {
  // Alternância entre as abas Viajante / Admin
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Mostra o formulário correspondente à aba selecionada
      document.getElementById('loginForm').classList.toggle('hidden', tab === 'admin');
      document.getElementById('adminLoginForm').classList.toggle('hidden', tab === 'viajante');
    });
  });

  // Submit do formulário de viajante
  document.getElementById('loginForm').addEventListener('submit', handleTravelerLogin);

  // Submit do formulário de admin
  document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);

  // Botão para ir ao cadastro
  document.getElementById('goRegister').addEventListener('click', e => {
    e.preventDefault();
    goTo('registerScreen');
  });
}

/**
 * Processa o login do viajante.
 * Valida CPF e senha contra o banco de dados em memória.
 * @param {Event} e — evento de submit
 */
function handleTravelerLogin(e) {
  e.preventDefault();
  const cpf   = document.getElementById('loginCPF').value.trim();
  const senha = document.getElementById('loginSenha').value.trim();
  const err   = document.getElementById('loginError');

  const traveler = findTravelerByCPF(cpf);

  if (!traveler) {
    err.textContent = 'CPF não encontrado. Verifique ou cadastre-se.';
    err.classList.remove('hidden');
    return;
  }

  if (traveler.senha !== senha) {
    err.textContent = 'Senha incorreta. A senha inicial é "viagem123".';
    err.classList.remove('hidden');
    return;
  }

  // Login bem-sucedido: salva o usuário atual e vai para o dashboard
  err.classList.add('hidden');
  AppState.currentUser = { cpf, role: 'traveler', data: traveler };
  loadTravelerDashboard(traveler);
  goTo('travelerDashboard');
}

/**
 * Processa o login do administrador.
 * Credenciais fixas: admin / admin123
 * @param {Event} e — evento de submit
 */
function handleAdminLogin(e) {
  e.preventDefault();
  const user  = document.getElementById('adminUser').value.trim();
  const senha = document.getElementById('adminPass').value.trim();
  const err   = document.getElementById('adminLoginError');

  // Verifica as credenciais fixas do administrador
  if (user === 'admin' && senha === 'admin123') {
    err.classList.add('hidden');
    AppState.currentUser = { role: 'admin' };
    loadAdminDashboard();
    goTo('adminDashboard');
  } else {
    err.textContent = 'Credenciais inválidas. Usuário: admin | Senha: admin123';
    err.classList.remove('hidden');
  }
}

/** Realiza o logout e retorna à tela de login */
function logout() {
  AppState.currentUser = null;
  // Limpa os campos de senha por segurança
  document.getElementById('loginSenha').value = '';
  document.getElementById('adminPass').value = '';
  goTo('loginScreen');
}

/* ============================================================
   CADASTRO DO VIAJANTE (PASSO 1)
   ============================================================ */

/** Configura os campos condicionais que dependem de outros valores */
function setupConditionalFields() {
  // Campos extras para menores de idade
  document.querySelectorAll('input[name="idade"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const menorFields = document.getElementById('menorFields');
      const isMenor = document.getElementById('radioMenor').checked;
      menorFields.classList.toggle('hidden', !isMenor);

      // Ajusta obrigatoriedade dos campos do responsável
      document.getElementById('regResponsavel').required = isMenor;
      document.getElementById('regNascimento').required  = isMenor;
    });
  });

  // Campo de descrição de alergia
  document.querySelectorAll('input[name="alergia"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const alergiaFields = document.getElementById('alergiaFields');
      const haAlergia = document.getElementById('radioAlergiaSim').checked;
      alergiaFields.classList.toggle('hidden', !haAlergia);
      document.getElementById('regAlergia').required = haAlergia;
    });
  });
}

/** Configura o formulário de cadastro (submit) */
function setupRegisterForm() {
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
}

/**
 * Processa o cadastro de um novo viajante.
 * Valida os campos, cria o objeto do viajante e avança para pagamento.
 * @param {Event} e — evento de submit
 */
function handleRegister(e) {
  e.preventDefault();
  const errEl = document.getElementById('registerError');
  errEl.classList.add('hidden');

  // Coleta todos os valores do formulário
  const nome       = document.getElementById('regNome').value.trim();
  const cpf        = document.getElementById('regCPF').value.trim();
  const email      = document.getElementById('regEmail').value.trim();
  const telefone   = document.getElementById('regTelefone').value.trim();
  const idadeVal   = document.querySelector('input[name="idade"]:checked');
  const alergiaVal = document.querySelector('input[name="alergia"]:checked');
  const transpVal  = document.querySelector('input[name="transporte"]:checked');

  // Validações básicas dos campos obrigatórios
  if (!nome || !cpf || !email || !telefone || !idadeVal || !alergiaVal || !transpVal) {
    errEl.textContent = 'Preencha todos os campos obrigatórios (*).';
    errEl.classList.remove('hidden');
    return;
  }

  // Verifica se o CPF já está cadastrado (evita duplicatas)
  if (findTravelerByCPF(cpf)) {
    errEl.textContent = 'Este CPF já está cadastrado. Faça login.';
    errEl.classList.remove('hidden');
    return;
  }

  // Valida campos específicos para menores de idade
  const isMenor = idadeVal.value === 'menor';
  let responsavelCPF = null;
  let nascimento = null;

  if (isMenor) {
    responsavelCPF = document.getElementById('regResponsavel').value.trim();
    nascimento     = document.getElementById('regNascimento').value;

    if (!responsavelCPF || !nascimento) {
      errEl.textContent = 'Para menores de idade, informe o responsável e a data de nascimento.';
      errEl.classList.remove('hidden');
      return;
    }

    // Verifica se o responsável existe no sistema
    if (!findTravelerByCPF(responsavelCPF)) {
      errEl.textContent = 'O CPF do responsável informado não está cadastrado.';
      errEl.classList.remove('hidden');
      return;
    }
  }

  // Monta o objeto do novo viajante
  const newTraveler = {
    cpf,
    nome,
    email,
    telefone,
    idade: idadeVal.value,
    nascimento: nascimento || null,
    responsavelCPF: responsavelCPF || null,
    alergia: alergiaVal.value,
    alergiaDesc: alergiaVal.value === 'sim' ? document.getElementById('regAlergia').value : '',
    transporte: transpVal.value,
    familia: document.getElementById('regFamilia').value.trim(),
    parentesco: document.getElementById('regParentesco').value,
    senha: 'viagem123', // senha padrão inicial
    payStatus: 'analise',
    payMethod: null,
    seat: null,
    andar: null,
    quarto: null,
    tipoQuarto: null
  };

  // Armazena temporariamente o novo viajante
  AppState.newTraveler = newTraveler;

  // Avança para a tela de pagamento
  goTo('paymentScreen');
}

/* ============================================================
   PAGAMENTO (PASSO 2)
   ============================================================ */

/**
 * Seleciona o método de pagamento e exibe os detalhes correspondentes.
 * @param {'pix'|'boleto'} method — método escolhido
 */
function selectPayment(method) {
  // Marca o card selecionado visualmente
  document.getElementById('pixMethod').classList.toggle('selected', method === 'pix');
  document.getElementById('boletoMethod').classList.toggle('selected', method === 'boleto');

  // Mostra o painel do método escolhido, oculta o outro
  document.getElementById('pixDetails').classList.toggle('hidden', method !== 'pix');
  document.getElementById('boletoDetails').classList.toggle('hidden', method !== 'boleto');

  // Salva o método no viajante temporário
  if (AppState.newTraveler) AppState.newTraveler.payMethod = method;
}

/** Copia a chave PIX para a área de transferência */
function copyPix() {
  const key = document.getElementById('pixKey').textContent;
  navigator.clipboard.writeText(key).then(() => showToast('Chave PIX copiada!'));
}

/**
 * Recalcula o valor de cada parcela do boleto e exibe na tela.
 * Evento disparado quando o select de parcelas muda.
 */
function calcParcelas() {
  const valorTotal = 850;
  const parcelas   = parseInt(document.getElementById('parcelas').value);
  const valorParcela = (valorTotal / parcelas).toFixed(2);
  const label = parcelas === 1
    ? `Total: R$ ${valorTotal},00 à vista`
    : `Total: ${parcelas}x de R$ ${valorParcela} (Total: R$ ${valorTotal},00)`;

  document.getElementById('parcelaLabel').textContent = label;
}

/**
 * Confirma o pagamento via PIX.
 * Adiciona o viajante ao banco de dados e avança para regras.
 */
function confirmPayment() {
  if (!AppState.newTraveler) return;
  AppState.newTraveler.payMethod = 'pix';
  finishPayment();
}

/**
 * Gera o boleto e avança para regras.
 */
function gerarBoleto() {
  if (!AppState.newTraveler) return;
  AppState.newTraveler.payMethod = 'boleto';
  showToast('Boleto gerado! Verifique seu e-mail.');
  finishPayment();
}

/**
 * Finaliza o processo de pagamento e vai para a tela de regras.
 * Verifica se um método foi selecionado.
 */
function finishPayment() {
  if (!AppState.newTraveler.payMethod) {
    showToast('Selecione uma forma de pagamento.', 'error');
    return;
  }
  goTo('rulesScreen');
}

/* ============================================================
   REGRAS (PASSO 3)
   ============================================================ */

/**
 * Verifica se o checkbox de aceite dos termos está marcado.
 * Habilita ou desabilita o botão de continuar.
 */
function checkTerms() {
  const accepted = document.getElementById('acceptTerms').checked;
  document.getElementById('btnContinueRules').disabled = !accepted;
}

/**
 * Avança da tela de regras para a confirmação.
 * Salva o viajante no banco de dados em memória.
 */
function goToConfirmation() {
  if (!AppState.newTraveler) return;

  // Adiciona o novo viajante ao array principal
  AppState.travelers.push(AppState.newTraveler);

  // Faz login automático com o viajante recém-cadastrado
  AppState.currentUser = {
    cpf: AppState.newTraveler.cpf,
    role: 'traveler',
    data: AppState.newTraveler
  };

  // Atualiza a tela de confirmação com os dados do viajante
  updateConfirmationScreen(AppState.newTraveler);

  goTo('confirmationScreen');
}

/**
 * Preenche a tela de confirmação com os dados do viajante.
 * @param {Object} traveler — dados do viajante
 */
function updateConfirmationScreen(traveler) {
  document.getElementById('summaryNome').textContent       = traveler.nome;
  document.getElementById('summaryCPF').textContent        = traveler.cpf;
  document.getElementById('summaryEmail').textContent      = traveler.email;
  document.getElementById('summaryTransporte').textContent =
    traveler.transporte === 'onibus' ? 'Ônibus da Igreja' : 'Veículo Próprio';
  document.getElementById('confirmAsiento').textContent    = traveler.seat || 'A ser definido';
  document.getElementById('confirmAndar').textContent      = traveler.andar || '—';
  document.getElementById('confirmQuarto').textContent     = traveler.quarto || 'A ser definido';
  document.getElementById('confirmTipoQuarto').textContent = traveler.tipoQuarto || '—';
}

/* ============================================================
   PAINEL DO VIAJANTE
   ============================================================ */

/**
 * Carrega os dados do viajante no seu painel pessoal.
 * @param {Object} traveler — objeto do viajante
 */
function loadTravelerDashboard(traveler) {
  // Saudação com o nome do viajante
  document.getElementById('travelerName').textContent = `Olá, ${traveler.nome.split(' ')[0]}`;
  document.getElementById('profileName').textContent  = traveler.nome;

  // Status do pagamento com badge colorido
  const statusMap = {
    pago: { label: 'Confirmado', cls: 'badge-paid' },
    pendente: { label: 'Pendente', cls: 'badge-pending' },
    analise: { label: 'Em análise', cls: 'badge-analise' },
    desistiu: { label: 'Desistência', cls: 'badge-cancel' }
  };
  const st = statusMap[traveler.payStatus] || statusMap.analise;
  const badgeEl = document.getElementById('dashPayStatus');
  badgeEl.textContent = st.label;
  badgeEl.className = `badge ${st.cls}`;

  // Método e valor do pagamento
  document.getElementById('dashPayMethod').textContent = traveler.payMethod === 'pix' ? 'PIX' : 'Boleto';
  document.getElementById('dashPayValue').textContent  = 'R$ 850,00';

  // Informação do assento
  const seatInfo = document.getElementById('dashSeatInfo');
  if (traveler.seat) {
    seatInfo.innerHTML = `<i class="fa-solid fa-couch"></i> <strong>Assento ${traveler.seat}</strong> — ${traveler.andar}`;
  } else {
    seatInfo.innerHTML = `<i class="fa-solid fa-hourglass-half"></i> <span>Aguardando atribuição pelo administrador</span>`;
  }

  // Informação do quarto
  const roomInfo = document.getElementById('dashRoomInfo');
  if (traveler.quarto) {
    roomInfo.innerHTML = `<i class="fa-solid fa-door-closed"></i> <strong>Quarto ${traveler.quarto}</strong> — ${traveler.tipoQuarto}`;
  } else {
    roomInfo.innerHTML = `<i class="fa-solid fa-hourglass-half"></i> <span>Aguardando atribuição pelo administrador</span>`;
  }

  // Verifica se tem dependentes (menores associados a este viajante)
  const dependentes = AppState.travelers.filter(t => t.responsavelCPF === traveler.cpf);
  if (dependentes.length > 0) {
    document.getElementById('dependentsCard').style.display = 'block';
    const list = document.getElementById('dependentsList');
    list.innerHTML = dependentes.map(d => `
      <div class="summary-row">
        <span>${d.nome}</span>
        <span class="badge badge-analise">Dependente</span>
      </div>
    `).join('');
  }
}

/* ============================================================
   PERFIL DO VIAJANTE — ALTERAÇÃO DE SENHA
   ============================================================ */

/**
 * Processa a alteração de senha do viajante.
 * Valida senha atual e garante que as novas senhas coincidem.
 */
function changePassword() {
  const currentPass = document.getElementById('currentPass').value;
  const newPass     = document.getElementById('newPass').value;
  const confirmPass = document.getElementById('confirmPass').value;
  const msgEl       = document.getElementById('passChangeMsg');

  const traveler = AppState.currentUser?.data;
  if (!traveler) return;

  // Verifica se a senha atual está correta
  if (currentPass !== traveler.senha) {
    msgEl.className = 'error-msg';
    msgEl.textContent = 'Senha atual incorreta.';
    msgEl.classList.remove('hidden');
    return;
  }

  // Verifica tamanho mínimo da nova senha
  if (newPass.length < 6) {
    msgEl.className = 'error-msg';
    msgEl.textContent = 'A nova senha deve ter pelo menos 6 caracteres.';
    msgEl.classList.remove('hidden');
    return;
  }

  // Verifica se as senhas novas coincidem
  if (newPass !== confirmPass) {
    msgEl.className = 'error-msg';
    msgEl.textContent = 'As senhas não coincidem.';
    msgEl.classList.remove('hidden');
    return;
  }

  // Atualiza a senha no banco de dados
  traveler.senha = newPass;
  AppState.currentUser.data.senha = newPass;

  msgEl.className = 'alert-info';
  msgEl.textContent = '✓ Senha alterada com sucesso!';
  msgEl.classList.remove('hidden');

  // Limpa os campos após sucesso
  document.getElementById('currentPass').value = '';
  document.getElementById('newPass').value     = '';
  document.getElementById('confirmPass').value = '';

  showToast('Senha alterada com sucesso!');
}

/* ============================================================
   PAINEL DO ADMINISTRADOR — CARREGAMENTO
   ============================================================ */

/** Inicializa o painel do admin: carrega todos os dados nas seções */
function loadAdminDashboard() {
  updateStats();
  renderPaymentsTable('todos');
  renderTravelersTable();
  renderMinorsTable();
  renderSpecialNeedsTable();
  renderTransportLists();
  renderBusSeats(1);
  renderBusSeats(2);
  renderHotelMap();
  initCharts();
}

/** Atualiza os cards de estatísticas no topo do painel */
function updateStats() {
  const total     = AppState.travelers.length;
  const pago      = AppState.travelers.filter(t => t.payStatus === 'pago').length;
  const pendente  = AppState.travelers.filter(t => t.payStatus === 'pendente').length;
  const desistiu  = AppState.travelers.filter(t => t.payStatus === 'desistiu').length;

  document.getElementById('statTotal').textContent    = total;
  document.getElementById('statPago').textContent     = pago;
  document.getElementById('statPendente').textContent = pendente;
  document.getElementById('statDesistiu').textContent = desistiu;
}

/* ============================================================
   NAVEGAÇÃO DO ADMIN (SIDEBAR)
   ============================================================ */

/** Configura os cliques nos itens de navegação da sidebar */
function setupAdminNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const sectionId = item.dataset.section;

      // Marca o item ativo na sidebar
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Mostra a seção correspondente, oculta as demais
      document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
      const section = document.getElementById(sectionId);
      if (section) section.classList.add('active');

      // Atualiza o título da topbar
      document.getElementById('adminSectionTitle').textContent = item.querySelector('span').textContent;

      // Fecha o menu lateral em mobile após navegar
      document.querySelector('.admin-sidebar').classList.remove('open');
    });
  });
}

/** Alterna visibilidade do menu lateral em mobile */
function toggleSidebar() {
  document.querySelector('.admin-sidebar').classList.toggle('open');
}

/* ============================================================
   PAINEL ADMIN — PAGAMENTOS
   ============================================================ */

/**
 * Renderiza a tabela de pagamentos com base no filtro selecionado.
 * @param {string} filter — 'todos'|'pago'|'pendente'|'analise'|'desistiu'
 */
function renderPaymentsTable(filter) {
  AppState.paymentFilter = filter;

  // Filtra viajantes conforme o status selecionado
  const data = filter === 'todos'
    ? AppState.travelers
    : AppState.travelers.filter(t => t.payStatus === filter);

  const tbody = document.getElementById('paymentsTableBody');

  // Mapeia status para rótulo e classe do badge
  const statusMap = {
    pago:     { label: 'Pago',        cls: 'badge-paid'    },
    pendente: { label: 'Pendente',    cls: 'badge-pending' },
    analise:  { label: 'Em análise',  cls: 'badge-analise' },
    desistiu: { label: 'Desistência', cls: 'badge-cancel'  }
  };

  // Gera as linhas da tabela dinamicamente
  tbody.innerHTML = data.map(t => {
    const st = statusMap[t.payStatus] || statusMap.analise;
    return `
      <tr>
        <td>${t.nome}</td>
        <td>${t.cpf}</td>
        <td>${t.payMethod ? (t.payMethod === 'pix' ? 'PIX' : 'Boleto') : '—'}</td>
        <td>R$ 850,00</td>
        <td><span class="badge ${st.cls}">${st.label}</span></td>
        <td>
          <select class="btn-table btn-edit" onchange="changePayStatus('${t.cpf}', this.value)">
            <option value="">Alterar...</option>
            <option value="pago">Confirmar</option>
            <option value="pendente">Pendente</option>
            <option value="analise">Em análise</option>
            <option value="desistiu">Desistência</option>
          </select>
        </td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="6" style="text-align:center;opacity:.5">Nenhum resultado</td></tr>';
}

/**
 * Altera o status de pagamento de um viajante.
 * @param {string} cpf — CPF do viajante
 * @param {string} newStatus — novo status
 */
function changePayStatus(cpf, newStatus) {
  if (!newStatus) return;
  const traveler = findTravelerByCPF(cpf);
  if (!traveler) return;
  traveler.payStatus = newStatus;
  renderPaymentsTable(AppState.paymentFilter);
  updateStats();
  updateCharts();
  showToast('Status de pagamento atualizado!');
}

/**
 * Filtra os pagamentos na tabela ao clicar nos botões de filtro.
 * @param {string} filter — filtro selecionado
 */
function filterPayments(filter) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  renderPaymentsTable(filter);
}

/* ============================================================
   PAINEL ADMIN — VIAJANTES
   ============================================================ */

/** Renderiza a tabela de todos os viajantes com opção de edição */
function renderTravelersTable() {
  const tbody = document.getElementById('travelersTableBody');
  tbody.innerHTML = AppState.travelers.map(t => `
    <tr>
      <td>${t.nome}</td>
      <td>${t.cpf}</td>
      <td>${t.familia || '—'}</td>
      <td>${t.parentesco || '—'}</td>
      <td><span class="badge ${t.idade === 'menor' ? 'badge-pending' : 'badge-analise'}">
        ${t.idade === 'menor' ? 'Menor' : 'Maior'}
      </span></td>
      <td>${t.transporte === 'onibus' ? '🚌 Ônibus' : '🚗 Próprio'}</td>
      <td>
        <button class="btn-table btn-edit" onclick="openEditModal('${t.cpf}')">
          <i class="fa-solid fa-pen"></i> Editar
        </button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="7" style="text-align:center;opacity:.5">Nenhum viajante</td></tr>';
}

/** Renderiza a tabela de menores de idade */
function renderMinorsTable() {
  const menores = AppState.travelers.filter(t => t.idade === 'menor');
  const tbody = document.getElementById('minorsTableBody');

  tbody.innerHTML = menores.map(t => {
    const responsavel = t.responsavelCPF ? findTravelerByCPF(t.responsavelCPF) : null;
    return `
      <tr>
        <td>${t.nome}</td>
        <td>${t.nascimento || '—'}</td>
        <td>${responsavel ? responsavel.nome : '—'}</td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="3" style="text-align:center;opacity:.5">Nenhum menor de idade</td></tr>';
}

/** Renderiza a tabela de viajantes com necessidades especiais */
function renderSpecialNeedsTable() {
  const especiais = AppState.travelers.filter(t => t.alergia === 'sim');
  const tbody = document.getElementById('specialNeedsTableBody');

  tbody.innerHTML = especiais.map(t => `
    <tr>
      <td>${t.nome}</td>
      <td>${t.alergiaDesc || '—'}</td>
    </tr>
  `).join('') || '<tr><td colspan="2" style="text-align:center;opacity:.5">Nenhum viajante com necessidade especial</td></tr>';
}

/* ——— Modal de Edição de Viajante ——— */

/** Abre o modal de edição populado com os dados do viajante */
function openEditModal(cpf) {
  const traveler = findTravelerByCPF(cpf);
  if (!traveler) return;

  // Guarda o CPF do viajante sendo editado
  document.getElementById('editTravelerModal').dataset.cpf = cpf;

  // Preenche os campos do formulário de edição
  document.getElementById('editNome').value       = traveler.nome;
  document.getElementById('editEmail').value      = traveler.email;
  document.getElementById('editTelefone').value   = traveler.telefone;
  document.getElementById('editFamilia').value    = traveler.familia || '';
  document.getElementById('editParentesco').value = traveler.parentesco || '';
  document.getElementById('editPayStatus').value  = traveler.payStatus || 'analise';

  // Exibe o modal e o overlay
  document.getElementById('editTravelerModal').classList.remove('hidden');
  document.getElementById('modalOverlay').classList.remove('hidden');
}

/** Salva as alterações feitas no modal de edição */
function saveEditTraveler() {
  const cpf = document.getElementById('editTravelerModal').dataset.cpf;
  const traveler = findTravelerByCPF(cpf);
  if (!traveler) return;

  // Atualiza os campos editáveis
  traveler.nome       = document.getElementById('editNome').value.trim();
  traveler.email      = document.getElementById('editEmail').value.trim();
  traveler.telefone   = document.getElementById('editTelefone').value.trim();
  traveler.familia    = document.getElementById('editFamilia').value.trim();
  traveler.parentesco = document.getElementById('editParentesco').value;
  traveler.payStatus  = document.getElementById('editPayStatus').value;

  // Re-renderiza as tabelas com os dados atualizados
  renderTravelersTable();
  renderPaymentsTable(AppState.paymentFilter);
  updateStats();
  updateCharts();
  closeEditModal();
  showToast('Viajante atualizado com sucesso!');
}

/** Fecha o modal de edição */
function closeEditModal() {
  document.getElementById('editTravelerModal').classList.add('hidden');
  document.getElementById('modalOverlay').classList.add('hidden');
}

/* ——— Sub-tabs de Viajantes ——— */
/**
 * Alterna entre as sub-abas da seção de viajantes.
 * @param {string} tabId — ID do conteúdo da sub-aba
 */
function showSubTab(tabId) {
  document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'));

  document.getElementById(tabId).classList.add('active');

  // Ativa o botão correspondente
  document.querySelectorAll('.sub-tab').forEach(btn => {
    if (btn.getAttribute('onclick').includes(tabId)) btn.classList.add('active');
  });
}

/* ============================================================
   PAINEL ADMIN — TRANSPORTE
   ============================================================ */

/** Renderiza as listas de transporte (ônibus × veículo próprio) */
function renderTransportLists() {
  const busList   = AppState.travelers.filter(t => t.transporte === 'onibus');
  const carList   = AppState.travelers.filter(t => t.transporte === 'proprio');

  // Lista do ônibus: chips com nome
  document.getElementById('busTravelersList').innerHTML =
    busList.map(t => `<li><i class="fa-solid fa-user"></i> ${t.nome}</li>`).join('') ||
    '<li style="opacity:.5">Nenhum viajante</li>';

  // Lista de veículo próprio
  document.getElementById('ownCarList').innerHTML =
    carList.map(t => `<li><i class="fa-solid fa-user"></i> ${t.nome}</li>`).join('') ||
    '<li style="opacity:.5">Nenhum viajante</li>';
}

/* ——— Mapa de Assentos do Ônibus ——— */

/**
 * Renderiza os assentos de um andar do ônibus.
 * Gera um grid de assentos clicáveis mostrando quem está alocado.
 * @param {number} floor — número do andar (1 ou 2)
 */
/**
 * Layout exato do ônibus conforme a imagem de referência.
 * Piso Superior (1): assentos 01–44, disposição 2+2 com corredor central.
 *   Lado esquerdo: pares ímpares crescentes (01/02, 05/06, 07/08...)
 *   Lado direito: pares com numeração espelhada (04/03, 12/11, 16/15...)
 *   Fileiras 1-2 do lado direito têm espaço para banheiro/escada.
 * Piso Inferior (2): assentos 45–56, apenas traseira (motorista + bagageiro na frente).
 */
const BUS_LAYOUT = {
  // Piso Superior — 44 assentos numerados em pares por fileira
  // Cada fileira: [esq1, esq2, dir2, dir1] — null = vazio/estrutura
  1: [
    // fileira 1
    { left: ['01','02'], right: ['04','03'] },
    // fileira 2: lado direito ocupado por banheiro/armário
    { left: ['05','06'], right: [null, null], rightBlock: 'banheiro' },
    // fileira 3: lado direito ainda bloqueado
    { left: ['07','08'], right: [null, null], rightBlock: 'tv' },
    // fileira 4
    { left: ['09','10'], right: ['12','11'] },
    { left: ['13','14'], right: ['16','15'] },
    { left: ['17','18'], right: ['20','19'] },
    { left: ['21','22'], right: ['24','23'] },
    { left: ['25','26'], right: ['28','27'] },
    { left: ['29','30'], right: ['32','31'] },
    { left: ['33','34'], right: ['36','35'] },
    { left: ['37','38'], right: ['40','39'] },
    { left: ['41','42'], right: ['44','43'] },
  ],
  // Piso Inferior — motorista na frente, bagageiro, depois 12 assentos no fundo
  2: [
    { left: [null, null], right: [null, null], frontBlock: 'motorista' },
    { left: [null, null], right: [null, null], frontBlock: 'bagageiro' },
    { left: ['45','46'], right: ['48','47'] },
    { left: ['49','50'], right: ['52','51'] },
    { left: ['53','54'], right: ['56','55'], rightBlock: 'porta' },
  ]
};

function renderBusSeats(floor) {
  const container = document.getElementById(`busSeats${floor}`);
  const layout    = BUS_LAYOUT[floor];
  let html = '';

  layout.forEach((row, rowIdx) => {
    // Bloco especial (motorista/bagageiro) no piso inferior
    if (row.frontBlock) {
      if (row.frontBlock === 'motorista') {
        html += `
          <div class="bus-row">
            <div class="bus-block-full driver-block">
              <i class="fa-solid fa-steering-wheel"></i>
              <span>Motorista</span>
            </div>
          </div>`;
      } else if (row.frontBlock === 'bagageiro') {
        html += `
          <div class="bus-row">
            <div class="bus-block-full luggage-block">
              <i class="fa-solid fa-suitcase-rolling"></i>
              <span>Porta-malas</span>
            </div>
          </div>`;
      }
      return;
    }

    html += `<div class="bus-row">`;

    // Renderiza os dois assentos do lado esquerdo
    html += `<div class="seat-pair">`;
    row.left.forEach(seatId => {
      html += renderSingleSeat(floor, seatId);
    });
    html += `</div>`;

    // Corredor central
    html += `<div class="bus-aisle-v"></div>`;

    // Renderiza os dois assentos do lado direito (ou bloco estrutural)
    html += `<div class="seat-pair">`;
    if (row.rightBlock === 'banheiro') {
      html += `<div class="bus-block side-block bathroom-block">
        <i class="fa-solid fa-restroom"></i><span>Banheiro</span>
      </div>`;
    } else if (row.rightBlock === 'tv') {
      html += `<div class="bus-block side-block tv-block">
        <i class="fa-solid fa-tv"></i><span>Entretenimento</span>
      </div>`;
    } else if (row.rightBlock === 'porta') {
      html += `<div class="bus-block side-block door-block">
        <i class="fa-solid fa-door-open"></i><span>Saída</span>
      </div>`;
    } else {
      row.right.forEach(seatId => {
        html += renderSingleSeat(floor, seatId);
      });
    }
    html += `</div>`;

    html += `</div>`; // fim .bus-row
  });

  container.innerHTML = html;
}

/**
 * Renderiza um assento individual numerado.
 * @param {number} floor — andar
 * @param {string|null} seatId — número do assento (ex: '01') ou null
 */
function renderSingleSeat(floor, seatId) {
  if (!seatId) return `<div class="bus-seat-empty"></div>`;

  const occupant   = AppState.busSeats[floor][seatId];
  const traveler   = occupant ? findTravelerByCPF(occupant) : null;
  const isOccupied = !!occupant;
  const firstName  = traveler?.nome?.split(' ')[0] || '';

  return `
    <div class="bus-seat-new ${isOccupied ? 'occupied' : 'available'}"
         id="seat-${floor}-${seatId}"
         onclick="openSeatModal(${floor}, '${seatId}')"
         title="${isOccupied ? traveler?.nome || 'Ocupado' : 'Assento ' + seatId + ' — Disponível'}">
      <div class="seat-back"></div>
      <div class="seat-base">
        <span class="seat-num">${seatId}</span>
        ${isOccupied ? `<span class="seat-occupant">${firstName}</span>` : ''}
      </div>
    </div>
  `;
}

/**
 * Exibe ou oculta o andar do ônibus selecionado.
 * @param {number} floor — andar a ser exibido
 */
function showFloor(floor) {
  document.querySelectorAll('.bus-floor').forEach(f => f.classList.remove('active'));
  document.getElementById(`floor${floor}`).classList.add('active');
  document.querySelectorAll('.floor-btn').forEach((b, i) => {
    b.classList.toggle('active', i + 1 === floor);
  });
}

/** Referência ao assento sendo editado no modal */
let currentSeat = { floor: null, seatId: null };

/**
 * Abre o modal para alocar um viajante a um assento.
 * @param {number} floor — andar do ônibus
 * @param {string} seatId — identificador do assento (ex: 'A3')
 */
function openSeatModal(floor, seatId) {
  currentSeat = { floor, seatId };
  const modal = document.getElementById('seatModal');
  document.getElementById('seatModalTitle').textContent =
    `Assento ${seatId} — ${floor === 1 ? 'Piso Superior' : 'Piso Inferior'}`;

  // Preenche o select com viajantes do ônibus (sem assento alocado neste andar)
  const bustravelers = AppState.travelers.filter(t => t.transporte === 'onibus');
  const select = document.getElementById('seatTravelerSelect');

  const currentOccupant = AppState.busSeats[floor][seatId];

  select.innerHTML = `<option value="">— Selecione —</option>` +
    (currentOccupant ? `<option value="remove">🗑 Remover atual</option>` : '') +
    bustravelers.map(t => `
      <option value="${t.cpf}" ${t.cpf === currentOccupant ? 'selected' : ''}>
        ${t.nome} ${t.cpf === currentOccupant ? '(atual)' : ''}
      </option>
    `).join('');

  modal.classList.remove('hidden');
  document.getElementById('modalOverlay').classList.remove('hidden');
}

/** Fecha o modal de assento */
function closeSeatModal() {
  document.getElementById('seatModal').classList.add('hidden');
  document.getElementById('modalOverlay').classList.add('hidden');
}

/**
 * Confirma a alocação de um viajante em um assento.
 * Atualiza o estado do ônibus e re-renderiza o mapa.
 */
function assignSeat() {
  const { floor, seatId } = currentSeat;
  const select = document.getElementById('seatTravelerSelect');
  const cpf    = select.value;

  if (!cpf) { showToast('Selecione um viajante ou a opção de remover.', 'error'); return; }

  // Remove alocações anteriores do mesmo viajante neste andar
  Object.keys(AppState.busSeats[floor]).forEach(s => {
    if (AppState.busSeats[floor][s] === cpf) delete AppState.busSeats[floor][s];
  });

  if (cpf === 'remove') {
    // Remove o ocupante atual do assento
    delete AppState.busSeats[floor][seatId];
    const traveler = AppState.travelers.find(t => t.seat === seatId && t.andar?.startsWith(String(floor)));
    if (traveler) { traveler.seat = null; traveler.andar = null; }
  } else {
    // Aloca o novo viajante ao assento
    AppState.busSeats[floor][seatId] = cpf;
    const traveler = findTravelerByCPF(cpf);
    if (traveler) { traveler.seat = seatId; traveler.andar = floor === 1 ? 'Piso Superior' : 'Piso Inferior'; }
  }

  // Re-renderiza o mapa atualizado
  renderBusSeats(floor);
  closeSeatModal();
  showToast(`Assento ${seatId} atualizado!`);
}

/* ============================================================
   PAINEL ADMIN — HOTEL
   ============================================================ */

/** Renderiza o mapa de apartamentos do hotel */
function renderHotelMap() {
  const hotelMap = document.getElementById('hotelMap');

  hotelMap.innerHTML = AppState.hotelRooms.map(room => {
    const ocupados    = room.ocupantes.length;
    const capacidade  = room.capacidade;
    const pct         = Math.round((ocupados / capacidade) * 100);
    const fillClass   = pct >= 100 ? 'full' : pct >= 60 ? 'medium' : 'low';

    return `
      <div class="hotel-room" onclick="openRoomModal('${room.id}')">
        <div class="room-number">Qto ${room.id}</div>
        <div class="room-type">${room.tipo}</div>
        <div class="room-occupancy">
          <span>${ocupados}/${capacidade}</span>
          <div class="occupancy-bar">
            <div class="occupancy-fill ${fillClass}" style="width:${pct}%"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/** Referência ao quarto sendo editado no modal */
let currentRoomId = null;

/**
 * Abre o modal de gerenciamento de um quarto do hotel.
 * @param {string} roomId — ID do quarto (ex: '101')
 */
function openRoomModal(roomId) {
  currentRoomId = roomId;
  const room = AppState.hotelRooms.find(r => r.id === roomId);
  if (!room) return;

  document.getElementById('roomModalTitle').textContent =
    `Quarto ${room.id} — ${room.tipo} (Cap: ${room.capacidade})`;

  // Lista os ocupantes atuais com opção de remover
  const occupantsList = document.getElementById('roomOccupantsList');
  occupantsList.innerHTML = room.ocupantes.length
    ? room.ocupantes.map(cpf => {
        const t = findTravelerByCPF(cpf);
        return `
          <div class="occupant-item">
            <span><i class="fa-solid fa-user"></i> ${t ? t.nome : cpf}</span>
            <button onclick="removeFromRoom('${roomId}', '${cpf}')">
              <i class="fa-solid fa-xmark"></i> Remover
            </button>
          </div>
        `;
      }).join('')
    : '<p style="opacity:.5;font-size:.85rem">Nenhum ocupante</p>';

  // Preenche o select para adicionar novo viajante ao quarto
  const select = document.getElementById('roomTravelerSelect');
  select.innerHTML = `<option value="">— Selecione —</option>` +
    AppState.travelers
      .filter(t => !room.ocupantes.includes(t.cpf))
      .map(t => `<option value="${t.cpf}">${t.nome} (${t.familia || 'sem família'})</option>`)
      .join('');

  document.getElementById('roomModal').classList.remove('hidden');
  document.getElementById('modalOverlay').classList.remove('hidden');
}

/** Fecha o modal do quarto */
function closeRoomModal() {
  document.getElementById('roomModal').classList.add('hidden');
  document.getElementById('modalOverlay').classList.add('hidden');
}

/**
 * Adiciona um viajante ao quarto selecionado.
 * Verifica capacidade máxima antes de adicionar.
 */
function addToRoom() {
  const room = AppState.hotelRooms.find(r => r.id === currentRoomId);
  if (!room) return;

  const cpf = document.getElementById('roomTravelerSelect').value;
  if (!cpf) { showToast('Selecione um viajante.', 'error'); return; }

  // Verifica se o quarto tem capacidade disponível
  if (room.ocupantes.length >= room.capacidade) {
    showToast('Quarto cheio! Capacidade máxima atingida.', 'error');
    return;
  }

  // Adiciona o viajante ao quarto
  room.ocupantes.push(cpf);

  // Atualiza os dados do viajante
  const traveler = findTravelerByCPF(cpf);
  if (traveler) { traveler.quarto = currentRoomId; traveler.tipoQuarto = room.tipo; }

  // Fecha e re-abre o modal para atualizar a lista
  closeRoomModal();
  openRoomModal(currentRoomId);
  renderHotelMap();
  showToast(`${traveler?.nome || cpf} adicionado ao quarto ${currentRoomId}!`);
}

/**
 * Remove um viajante do quarto.
 * @param {string} roomId — ID do quarto
 * @param {string} cpf — CPF do viajante a ser removido
 */
function removeFromRoom(roomId, cpf) {
  const room = AppState.hotelRooms.find(r => r.id === roomId);
  if (!room) return;

  // Remove o CPF da lista de ocupantes
  room.ocupantes = room.ocupantes.filter(c => c !== cpf);

  // Limpa as informações de quarto do viajante
  const traveler = findTravelerByCPF(cpf);
  if (traveler) { traveler.quarto = null; traveler.tipoQuarto = null; }

  closeRoomModal();
  openRoomModal(roomId);
  renderHotelMap();
  showToast('Viajante removido do quarto.');
}

/* ============================================================
   GRÁFICOS (Chart.js)
   ============================================================ */

/** Inicializa os gráficos de pizza do painel admin */
function initCharts() {
  const pago     = AppState.travelers.filter(t => t.payStatus === 'pago').length;
  const pendente = AppState.travelers.filter(t => t.payStatus === 'pendente').length;
  const analise  = AppState.travelers.filter(t => t.payStatus === 'analise').length;
  const desistiu = AppState.travelers.filter(t => t.payStatus === 'desistiu').length;

  const onibus = AppState.travelers.filter(t => t.transporte === 'onibus').length;
  const proprio = AppState.travelers.filter(t => t.transporte === 'proprio').length;

  // Configuração visual comum para os gráficos (tema escuro)
  const chartDefaults = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { size: 11 } }
      }
    }
  };

  // Gráfico de status de pagamentos
  const ctxPag = document.getElementById('chartPagamentos');
  if (ctxPag) {
    if (AppState.charts.pagamentos) AppState.charts.pagamentos.destroy();
    AppState.charts.pagamentos = new Chart(ctxPag, {
      type: 'doughnut',
      data: {
        labels: ['Pagos', 'Pendentes', 'Em análise', 'Desistências'],
        datasets: [{
          data: [pago, pendente, analise, desistiu],
          backgroundColor: ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444'],
          borderWidth: 0
        }]
      },
      options: chartDefaults
    });
  }

  // Gráfico de meio de transporte
  const ctxTrans = document.getElementById('chartTransporte');
  if (ctxTrans) {
    if (AppState.charts.transporte) AppState.charts.transporte.destroy();
    AppState.charts.transporte = new Chart(ctxTrans, {
      type: 'doughnut',
      data: {
        labels: ['Ônibus da Igreja', 'Veículo Próprio'],
        datasets: [{
          data: [onibus, proprio],
          backgroundColor: ['#c9a84c', '#475569'],
          borderWidth: 0
        }]
      },
      options: chartDefaults
    });
  }
}

/** Atualiza os gráficos existentes com dados novos */
function updateCharts() {
  if (AppState.charts.pagamentos || AppState.charts.transporte) {
    initCharts();
  }
}

/* ============================================================
   FECHAR TODOS OS MODAIS
   ============================================================ */

/** Fecha todos os modais abertos (chamado ao clicar no overlay) */
function closeAllModals() {
  document.getElementById('editTravelerModal').classList.add('hidden');
  document.getElementById('seatModal').classList.add('hidden');
  document.getElementById('roomModal').classList.add('hidden');
  document.getElementById('modalOverlay').classList.add('hidden');
}