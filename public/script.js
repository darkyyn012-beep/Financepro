// Deixe vazio para usar a mesma URL do site (importante para o Render)
const API_URL = ''; 

let currentUser = null;
let myChart = null;

// Funções de Autenticação
function toggleAuth() {
    const loginDiv = document.getElementById('login-form');
    const regDiv = document.getElementById('register-form');
    if (loginDiv.style.display === 'none') {
        loginDiv.style.display = 'block';
        regDiv.style.display = 'none';
    } else {
        loginDiv.style.display = 'none';
        regDiv.style.display = 'block';
    }
}

async function login() {
    // MODIFICADO: Agora busca pelo ID 'login-user'
    const username = document.getElementById('login-user').value;
    const password = document.getElementById('login-pass').value;

    const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // MODIFICADO: Envia 'username' no lugar de 'email'
        body: JSON.stringify({ username, password })
    });

    if (res.ok) {
        currentUser = await res.json();
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('dashboard-screen').style.display = 'block';
        
        // Define mês atual por padrão
        const now = new Date();
        document.getElementById('current-month').value = now.toISOString().slice(0, 7);
        loadDashboard();
    } else {
        alert('Usuário ou senha incorretos!');
    }
}

async function register() {
    // MODIFICADO: Agora busca pelo ID 'reg-user'
    const username = document.getElementById('reg-user').value;
    const pass = document.getElementById('reg-pass').value;
    const confirm = document.getElementById('reg-confirm').value;

    if (pass !== confirm) return alert('Senhas não conferem!');

    const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // MODIFICADO: Envia 'username' no lugar de 'email'
        body: JSON.stringify({ username, password: pass })
    });

    if (res.ok) {
        alert('Cadastrado! Faça login com seu novo usuário.');
        toggleAuth();
    } else {
        alert('Erro ao cadastrar. Esse usuário já existe?');
    }
}

function logout() {
    currentUser = null;
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('dashboard-screen').style.display = 'none';
}

// Funções do Dashboard
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

    await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    alert('Gasto salvo!');
    loadDashboard(); // Atualiza o gráfico
}

async function loadDashboard() {
    if (!currentUser) return;
    const month = document.getElementById('current-month').value;

    const res = await fetch(`${API_URL}/expenses/${currentUser.id}?month=${month}`);
    const expenses = await res.json();

    // Calcular Totais por Categoria
    const categories = {};
    let total = 0;

    expenses.forEach(exp => {
        const val = parseFloat(exp.amount);
        total += val;
        if (categories[exp.category]) {
            categories[exp.category] += val;
        } else {
            categories[exp.category] = val;
        }
    });

    document.getElementById('total-display').innerText = `Total: R$ ${total.toFixed(2)}`;
    renderChart(categories);
}

function renderChart(dataObj) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    if (myChart) myChart.destroy(); // Destroi gráfico antigo para criar o novo

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(dataObj),
            datasets: [{
                data: Object.values(dataObj),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
            }]
        }
    });
}