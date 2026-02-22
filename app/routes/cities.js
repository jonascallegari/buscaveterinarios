const express = require("express");
const router = express.Router();
const db = require("../database");

// LISTAR CIDADES
router.get("/", (req, res) => {
    db.all("SELECT * FROM cities", [], (err, rows) => {
        res.json(rows);
    });
});

// CRIAR CIDADE
router.post("/", (req, res) => {   
    const slug = req.body.name
        .toLowerCase()
        .replace(/ /g, '-')
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    db.run(
        `INSERT INTO cities (name, state, slug) VALUES (?, ?, ?)`,
        [req.body.name, req.body.state, slug],
        function () {
            res.json({ id: this.lastID });
        }
    );
});

// EXCLUIR CIDADE
router.delete("/:id", (req, res) => {
    db.run("DELETE FROM cities WHERE id = ?", [req.params.id], () => {
        res.json({ ok: true });
    });
});

module.exports = router;
