import express from "express";
import multer from "multer";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Configuração de upload (Multer)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const upload = multer({ storage });

// Banco SQLite
const db = await open({
  filename: "projeto/banco.db",
  driver: sqlite3.Database,
});

await db.exec(`
CREATE TABLE IF NOT EXISTS recomendacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  indicador TEXT NOT NULL,
  candidato TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  nascimento TEXT NOT NULL,
  curriculo TEXT NOT NULL,
  laudo TEXT NOT NULL,
  historico TEXT NOT NULL,
  data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);

// Rota de recebimento do formulário
app.post(
  "/enviar",
  upload.fields([
    { name: "curriculo", maxCount: 1 },
    { name: "laudo", maxCount: 1 },
    { name: "historico", maxCount: 1 },
  ]),
  async (req, res) => {
    const { indicador, candidato, cpf, nascimento } = req.body;
    const curriculo = req.files["curriculo"]?.[0].path;
    const laudo = req.files["laudo"]?.[0].path;
    const historico = req.files["historico"]?.[0].path;

    if (!indicador || !candidato || !cpf || !nascimento) {
      return res.status(400).send("Campos obrigatórios ausentes");
    }

    await db.run(
      "INSERT INTO recomendacoes (indicador, candidato, cpf, nascimento, curriculo, laudo, historico) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [indicador, candidato, cpf, nascimento, curriculo, laudo, historico]
    );

    res.send("Recomendação enviada com sucesso!");
  }
);

app.listen(3000, () => console.log("Servidor rodando em http://localhost:3000"));
