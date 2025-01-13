import express from 'express';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';

const app = express();
const port = 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json());

// Função para criar o banco de dados com better-sqlite3
function criarDbComJson(jsonData, dbPath) {
    const db = new Database(dbPath); // Conexão síncrona
    try {
        // Criar a tabela dinamicamente
        const columns = Object.keys(jsonData[0]).map((key) => `${key} TEXT`).join(', ');
        db.exec(`CREATE TABLE IF NOT EXISTS dados (${columns})`);

        // Inserir os dados usando prepared statements
        const placeholders = Object.keys(jsonData[0]).map(() => '?').join(', ');
        const insertQuery = `INSERT INTO dados (${Object.keys(jsonData[0]).join(', ')}) VALUES (${placeholders})`;
        const insertStmt = db.prepare(insertQuery);

        jsonData.forEach(item => {
            insertStmt.run(...Object.values(item));
        });

        db.close();
    } catch (error) {
        db.close();
        throw new Error('Erro ao criar banco de dados: ' + error.message);
    }
}

// Rota para gerar o banco de dados a partir do JSON enviado
app.post('/gerar-db', (req, res) => {
    const jsonData = req.body;

    if (!jsonData || !Array.isArray(jsonData) || jsonData.length === 0) {
        return res.status(400).json({ error: 'JSON inválido ou vazio.' });
    }

    const dbPath = path.join(__dirname, 'banco_de_dados.db');

    try {
        if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
        criarDbComJson(jsonData, dbPath);
        res.json({ message: 'Banco de dados gerado com sucesso!', dbPath });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para baixar o banco de dados gerado
app.get('/download-db', (req, res) => {
    const dbPath = path.join(__dirname, 'banco_de_dados.db');

    if (fs.existsSync(dbPath)) {
        res.download(dbPath, 'banco_de_dados.db');
    } else {
        res.status(404).json({ error: 'Banco de dados não encontrado' });
    }
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`API rodando em http://localhost:${port}`);
});
