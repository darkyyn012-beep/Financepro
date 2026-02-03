const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve os arquivos do site (HTML/CSS/JS)
app.use(express.static('public'));

// Pega a conexão do Render (Variável de Ambiente) ou usa uma local de teste
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false // Importante para conectar no Supabase via SSL
  }
});

// 1. Rota de Cadastro
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const newUser = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, password]
    );
    res.json(newUser.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar user' });
  }
});

// 2. Rota de Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length > 0 && user.rows[0].password === password) {
      res.json({ id: user.rows[0].id, email: user.rows[0].email });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas' });
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