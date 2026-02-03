const API_URL = ''; 

let currentUser = null;
let myChart = null;

// Função auxiliar para mostrar erro no campo
function showError(inputId, msgId, message) {
    const input = document.getElementById(inputId);
    const msgDiv = document.getElementById(msgId);
    
    if(input) input.classList.add('input-error');
    if(msgDiv) {
        msgDiv.innerText = message; // ou innerHTML com ícone
        msgDiv.style.display = 'block';
    }
}

// Limpa o erro quando o usuário começa a digitar
function clearError(prefix) {
    if (prefix === 'login') {
        document.getElementById('login-user').classList.remove('input-error');
        document.getElementById('login-pass').classList.remove('input-error');
        document.getElementById('login-error-msg').style.display = 'none';
        return;
    }
    // Para cadastro
    const input = document.getElementById(prefix);
    const msgDiv = document.getElementById('error-' + prefix);
    if(input) input.classList.remove('input-error');
    if(msgDiv) msgDiv.style.display = 'none';
    
    // Limpa erro global também
    document.getElementById('register-global-error').style.display = 'none';
}

function toggleAuth() {
    const loginDiv = document.getElementById('login-form');
    const regDiv = document.getElementById('register-form');
    
    // Limpa erros ao trocar de tela
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    document.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');

    if (loginDiv.style.display === 'none') {
        loginDiv.style.display = 'block';
        regDiv.style.display = 'none';
    } else {
        loginDiv.style.display = 'none';
        regDiv.style.display = 'block';
    }
}

async function login() {
    const usernameInput = document.getElementById('login-user');
    const passwordInput = document.getElementById('login-pass');
    
    const username = usernameInput.value;
    const password = passwordInput.value;

    if(!username || !password) {
        showError('login-user', 'login-error-msg', '⚠️ Preencha usuário e senha.');
        showError('login-pass', null, '');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (res.ok) {
            currentUser = await res.json();
            document.getElementById('auth-screen').style.display = 'none';
            document.getElementById('dashboard-screen').style.display = 'block';
            document.getElementById('welcome-msg').innerText = `Olá, ${currentUser.username}`;
            
            const now = new Date();
            document.getElementById('current-month').value = now.toISOString().slice(0, 7);
            loadDashboard();
        } else {
            // Erro de login: Mostra mensagem vermelha e borda
            showError('login-user', 'login-error-msg', '⚠️ Usuário ou senha incorretos.');
            showError('login-pass', null, ''); // Só borda na senha
        }
    } catch (e) {
        showError('login-user', 'login-error-msg', '⚠️ Erro de conexão com o servidor.');
    }
}

async function register() {
    const username = document.getElementById('reg-user').value;
    const pass = document.getElementById('reg-pass').value;
    const confirm = document.getElementById('reg-confirm').value;
    let hasError = false;

    // Validação 1: Usuário vazio
    if (!username) {
        showError('reg-user', 'error-reg-user', '⚠️ Digite um usuário.');
        hasError = true;
    }

    // Validação 2: Senha curta (Mínimo 6 dígitos)
    if (pass.length < 6) {
        showError('reg-pass', 'error-reg-pass', '⚠️ A senha deve ter no mínimo 6 dígitos.');
        hasError = true;
    }

    // Validação 3: Confirmação de senha
    if (pass !== confirm) {
        showError('reg-confirm', 'error-reg-confirm', '⚠️ As senhas não conferem.');
        hasError = true;
    }

    if (hasError) return; // Para aqui se tiver erro local

    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password: pass })
        });

        if (res.ok) {
            alert('Conta criada com sucesso! Faça login.'); // Esse alert de SUCESSO pode manter ou tirar
            toggleAuth();
        } else {
            const errorData = await res.json();
            // Erro vindo do servidor (ex: Usuário já existe)
            showError('reg-user', 'register-global-error', `⚠️ ${errorData.error || 'Erro ao cadastrar.'}`);
            document.getElementById('reg-user').classList.add('input-error');
        }
    } catch (e) {
        showError('reg-user', 'register-global-error', '⚠️ Erro de conexão.');
    }
}

function logout() {
    currentUser = null;
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('dashboard-screen').style.display = 'none';
}

// ... (Resto das funções de Dashboard addExpense/loadDashboard iguais ao anterior) ...
async function addExpense() {
    if (!currentUser) return;
    const data = {
        userId: currentUser.id,
        description: document.getElementById('desc').value,
        category: document.getElementById('cat').value,
        amount: parseFloat(document.getElementById('val').value),
        installments: parseInt(document.getElementById('parc').value),
        date: document.getElementById('date').value
    };

    if(!data.description || !data.amount || !data.date) {
        return alert("Preencha todos os campos do gasto!");
    }

    await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    alert('Gasto salvo!');
    document.getElementById('desc').value = '';
    document.getElementById('val').value = '';
    loadDashboard(); 
}

async function loadDashboard() {
    if (!currentUser) return;
    const month = document.getElementById('current-month').value;
    const res = await fetch(`${API_URL}/expenses/${currentUser.id}?month=${month}`);
    const expenses = await res.json();
    const categories = {};
    let total = 0;
    expenses.forEach(exp => {
        const val = parseFloat(exp.amount);
        total += val;
        categories[exp.category] = (categories[exp.category] || 0) + val;
    });
    document.getElementById('total-display').innerText = `Total: R$ ${total.toFixed(2)}`;
    renderChart(categories);
}

function renderChart(dataObj) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(dataObj),
            datasets: [{
                data: Object.values(dataObj),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
            }]
        }
    });
}