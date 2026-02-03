const API_URL = ''; 

let currentUser = null;
let myChart = null;

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
    // Pega o USUÁRIO
    const username = document.getElementById('login-user').value;
    const password = document.getElementById('login-pass').value;

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
        alert('Usuário ou senha incorretos!');
    }
}

async function register() {
    // Pega o USUÁRIO
    const username = document.getElementById('reg-user').value;
    const pass = document.getElementById('reg-pass').value;
    const confirm = document.getElementById('reg-confirm').value;

    if (!username) return alert('Digite um nome de usuário!');
    if (pass !== confirm) return alert('Senhas não conferem!');

    const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pass })
    });

    if (res.ok) {
        alert('Cadastrado! Faça login.');
        toggleAuth();
    } else {
        const errorData = await res.json();
        alert(errorData.error || 'Erro ao cadastrar.');
    }
}

function logout() {
    currentUser = null;
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('dashboard-screen').style.display = 'none';
}

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
    // Limpar campos
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