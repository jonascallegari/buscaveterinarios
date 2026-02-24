const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./app/database');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const sharp = require("sharp");
const path = require('path');
const fs = require("fs");

const citiesRoutes = require("./app/routes/cities");

const SECRET = "chave-secreta-super-segura";
const app = express();

// ---- MIDDLEWARES GLOBAIS ----
app.use(cors());
app.use(bodyParser.json());

/* =====================================================
   STATIC FILES
===================================================== */
app.use(express.static(path.join(__dirname, 'public')));

/* =====================================================
   FUNÇÃO GERAR SLUG
===================================================== */
function gerarSlug(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

db.all("SELECT id, name FROM clinics WHERE slug IS NULL OR slug = ''", [], (err, rows) => {

  if (rows.length > 0) {
    console.log("Gerando slugs para clínicas antigas...");

    rows.forEach(clinic => {
      const slug = gerarSlug(clinic.name);

      db.run(
        "UPDATE clinics SET slug = ? WHERE id = ?",
        [slug, clinic.id]
      );
    });
  }
});

// =============================
// ROTA AMIGÁVEL
// =============================

// Página individual da clínica
app.get('/:uf/:citySlug/:clinicSlug', (req, res, next) => {

  if (req.params.uf === 'api') return next();

  res.sendFile(path.join(__dirname, 'public/clinica.html'));
});

// Página da cidade
app.get('/:uf/:slug', (req, res, next) => {

  // Ignora chamadas da API
  if (req.params.uf === 'api') return next();

  res.sendFile(path.join(__dirname, 'public/cidade.html'));
});

/* =====================================================
   ROTAS API
===================================================== */
app.use("/api/cities", citiesRoutes);

// Buscar cidade pelo slug
app.get('/api/cities/:uf/:slug', (req, res) => {

  const { uf, slug } = req.params;

  db.get(
    "SELECT * FROM cities WHERE slug = ? AND LOWER(state) = LOWER(?)",
    [slug, uf],
    (err, city) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!city) return res.status(404).json({ error: "Cidade não encontrada" });

      res.json(city);
    }
  );
});

/* ===== Buscar clínicas da cidade ===== */
app.get('/api/clinics/:uf/:slug', (req, res) => {

  const { uf, slug } = req.params;

  const sql = `
    SELECT 
      clinics.*,
      cities.name AS city_name,
      cities.slug AS city_slug,
      cities.state AS city_state
    FROM clinics
    JOIN cities ON clinics.city_id = cities.id
    WHERE cities.slug = ?
      AND LOWER(cities.state) = LOWER(?)
  `;

  db.all(sql, [slug, uf], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });

});

/* ===== Buscar clínica individual ===== */
app.get('/api/clinic/:uf/:citySlug/:clinicSlug', (req, res) => {

  const { uf, citySlug, clinicSlug } = req.params;

  const sql = `
    SELECT 
      clinics.*,
      cities.name AS city_name,
      cities.slug AS city_slug,
      cities.state AS city_state
    FROM clinics
    JOIN cities ON clinics.city_id = cities.id
    WHERE clinics.slug = ?
      AND cities.slug = ?
      AND LOWER(cities.state) = LOWER(?)
  `;

  db.get(sql, [clinicSlug, citySlug, uf], (err, row) => {

    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Clínica não encontrada" });

    res.json(row);
  });
});

/* =====================================================
   AUTH
===================================================== */
function authMiddleware(req, res, next) {
  const token = req.headers.authorization;

  if (!token)
    return res.status(401).json({ error: "Token não informado" });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}

/* =====================================================
   UPLOAD LOGO
===================================================== */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
});

app.post("/api/upload", authMiddleware, upload.single("logo"), async (req, res) => {

  if (!req.file) {
    return res.status(400).json({ error: "Arquivo não enviado" });
  }

  try {

    const uploadDir = path.join(__dirname, "public/uploads/logos");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = Date.now() + ".webp";
    const filePath = path.join(uploadDir, fileName);

    await sharp(req.file.buffer)
      .resize({ width: 400 })
      .webp({ quality: 80 })
      .toFile(filePath);

    res.json({ url: "uploads/logos/" + fileName });

  } catch (err) {
    console.error("Erro no upload:", err);
    res.status(500).json({ error: "Erro ao processar imagem" });
  }
});

/* =====================================================
   LOGIN
===================================================== */
app.post('/api/login', (req, res) => { 

  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (!user) return res.status(401).json({ error: "Usuário inválido" });

    const valid = bcrypt.compareSync(password, user.password);

    if (!valid) return res.status(401).json({ error: "Senha inválida" });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token });
  });
});

// ALTERAR SENHA DO USUÁRIO LOGADO
app.put('/api/users/change-password', authMiddleware, (req, res) => {

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Preencha todos os campos" });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ error: "Nova senha muito curta" });
  }

  // Buscar usuário atual
  db.get("SELECT * FROM users WHERE id = ?", [req.user.id], (err, user) => {

    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    // Verifica senha atual
    const senhaValida = bcrypt.compareSync(currentPassword, user.password);

    if (!senhaValida) {
      return res.status(401).json({ error: "Senha atual incorreta" });
    }

    // Criptografa nova senha
    const hashed = bcrypt.hashSync(newPassword, 10);

    db.run(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashed, req.user.id],
      function (err) {

        if (err) return res.status(500).json({ error: err.message });

        res.json({
          success: true,
          message: "Senha alterada com sucesso"
        });
      }
    );
  });

});

// LISTAR CLÍNICAS POR CIDADE
app.get('/api/clinics/city/:cityId', (req, res) => {

  const sql = `
    SELECT 
      clinics.*,
      cities.name AS city_name,
      cities.state AS city_state
    FROM clinics
    LEFT JOIN cities ON clinics.city_id = cities.id
    WHERE clinics.city_id = ?
  `;

  db.all(sql, [req.params.cityId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });

});

// LISTAR CLÍNICAS
app.get('/api/clinics', (req, res) => {

  const sql = `
    SELECT 
      clinics.*,
      cities.name AS city_name,
      cities.state AS city_state
    FROM clinics
    LEFT JOIN cities ON clinics.city_id = cities.id
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });

});

/* =====================================================
   CRUD CLÍNICAS
===================================================== */

// CRIAR
app.post('/api/clinics', authMiddleware, (req, res) => {

  const c = req.body;
  const slug = gerarSlug(c.name);

  db.run(
    `INSERT INTO clinics 
     (city_id, name, slug, description, address, phone, whatsapp, latitude, longitude, logoImage)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [c.city_id, c.name, slug, c.description, c.address, c.phone, c.whatsapp, c.latitude, c.longitude, c.logoImage],
    function () {
      res.json({ id: this.lastID });
    }
  );
});

// ATUALIZAR
app.put('/api/clinics/:id', authMiddleware, (req, res) => {

  const c = req.body;
  const slug = gerarSlug(c.name);

  db.run(
    `UPDATE clinics SET 
      name=?, slug=?, description=?, address=?, phone=?, whatsapp=?, latitude=?, longitude=?, logoImage=?
     WHERE id=?`,
    [c.name, slug, c.description, c.address, c.phone, c.whatsapp, c.latitude, c.longitude, c.logoImage, req.params.id],
    () => res.json({ updated: true })
  );
});

// EXCLUIR
app.delete('/api/clinics/:id', authMiddleware, (req, res) => {
  db.run("DELETE FROM clinics WHERE id=?", [req.params.id], () => {
    res.json({ deleted: true });
  });
});

// EXCLUIR CIDADE
app.delete('/api/cities/:id', authMiddleware, (req, res) => {

  const id = req.params.id;

  db.run("DELETE FROM cities WHERE id = ?", [id], function (err) {

    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Cidade não encontrada" });
    }

    res.json({ success: true });
  });

});

/* =====================================================
   START SERVER
===================================================== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});


