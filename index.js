const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');



const app = express();
const port = 3000;
const __dirname = '/tmp'
app.use(express.json({ limit: '50mb' }));

// Configuração do body parser para aceitar JSON
app.use(bodyParser.json());

// Função para criar o banco de dados
function criarDbComJson(jsonData, dbPath) {
  const db = new sqlite3.Database(dbPath);

  // Criar a tabela com base nas chaves do JSON
  const columns = Object.keys(jsonData[0])
    .map((key) => `${key} TEXT`)
    .join(', ');
  const createTableQuery = `CREATE TABLE IF NOT EXISTS dados (${columns})`;

  db.run(createTableQuery, (err) => {
    if (err) {
      console.error('Erro ao criar tabela:', err);
      return;
    }

    // Inserir os dados no banco
    const placeholders = Object.keys(jsonData[0]).map(() => '?').join(', ');
    const insertQuery = `INSERT INTO dados (${Object.keys(jsonData[0]).join(', ')}) VALUES (${placeholders})`;

    jsonData.forEach((item) => {
      db.run(insertQuery, Object.values(item), (err) => {
        if (err) {
          console.error('Erro ao inserir dados:', err);
        }
      });
    });
  });

  db.close();
}

// Rota para gerar o banco de dados a partir do JSON enviado
app.post('/gerar-db', (req, res) => {
  const jsonData = req.body;

  if (!jsonData || !Array.isArray(jsonData) || jsonData.length === 0) {
    return res.status(400).json({ error: 'JSON inválido ou vazio.' });
  }

  // Caminho onde o banco de dados será gerado
  const dbPath = path.join(__dirname, 'banco_de_dados.db');

  // Verificar se o arquivo já existe e removê-lo
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath); // Apaga o banco de dados existente
  }

  // Criar o banco de dados a partir do JSON recebido
  criarDbComJson(jsonData, dbPath);

  // Retornar sucesso
  res.json({ message: 'Banco de dados gerado com sucesso!', dbPath });
});

// Rota para baixar o banco de dados gerado
app.get('/download-db', (req, res) => {
  const dbPath = path.join(__dirname, 'banco_de_dados.db');
  
  if (fs.existsSync(dbPath)) {
    res.download(dbPath, 'banco_de_dados.db', (err) => {
      if (err) {
        res.status(500).json({ error: 'Erro ao enviar o arquivo' });
      }
    });
  } else {
    res.status(404).json({ error: 'Banco de dados não encontrado' });
  }
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`API em execução em http://localhost:${port}`);
});
