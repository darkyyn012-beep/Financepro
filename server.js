const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(express.static('public'));

// Pega a variável do Render OU usa a string local
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// 1. Rota de Cadastro (AGORA COM USERNAME)
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
      return res.status(400).json({ error: 'Preencha todos os campos' });
  }

  try {
    const newUser = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, password]
    );
    res.json(newUser.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar. Usuário já existe?' });
  }
});

// 2. Rota de Login (AGORA COM USERNAME)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (user.rows.length > 0 && user.rows[0].password === password) {
      res.json({ id: user.rows[0].id, username: user.rows[0].username });
    } else {
      res.status(401).json({ error: 'Usuário ou senha incorretos' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// 3. Cadastrar Gasto
app.post('/expenses', async (req, res) => {
  const { userId, description, category, amount, installments, date } = req.body;
  try {
    await pool.query(
      'INSERT INTO expenses (user_id, description, category, amount, installments, date) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, description, category, amount, installments, date]
    );
    res.json({ message: 'Gasto salvo!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Pegar Gastos
app.get('/expenses/:userId', async (req, res) => {
  const { userId } = req.params;
  const { month } = req.query; 
  
  try {
    const expenses = await pool.query(
      `SELECT * FROM expenses 
       WHERE user_id = $1 
       AND TO_CHAR(date, 'YYYY-MM') = $2`,
      [userId, month]
    );
    res.json(expenses.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));