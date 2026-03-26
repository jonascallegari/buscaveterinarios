// clinicas.js

const name = document.getElementById("name");
const address = document.getElementById("address");
const phone = document.getElementById("phone");
const whatsapp = document.getElementById("whatsapp");
const description = document.getElementById("description");

let paginaAtual = 1;
const itensPorPagina = 10;

let todasClinicas = [];
let listaAtual = [];

/* =============================
   STATUS
============================= */

function getStatus(c) {

    const hoje = new Date();

    if (c.expiration_date) {

        const validade = new Date(c.expiration_date);

        if (validade < hoje) return "vencido";
    }

    if (!c.visible) return "oculto";

    return "ativo";
}

function getStatusBadge(c) {

    const status = getStatus(c);

    if (status === "vencido") {
        return '<span class="badge bg-danger">Vencido</span>';
    }

    if (status === "oculto") {
        return '<span class="badge bg-secondary">Oculto</span>';
    }

    return '<span class="badge bg-success">Ativo</span>';
}

/* =============================
   FILTROS
============================= */

function aplicarFiltros() {

    const busca = document.getElementById("buscaNome")?.value.toLowerCase() || "";
    const cidade = document.getElementById("filtroCidade")?.value;
    const status = document.getElementById("filtroStatus")?.value;

    let filtradas = [...todasClinicas];

    // 🔎 busca por nome
    if (busca) {
        filtradas = filtradas.filter(c =>
            c.name.toLowerCase().includes(busca)
        );
    }

    // 🏙 filtro cidade
    if (cidade) {
        filtradas = filtradas.filter(c =>
            c.city_id == cidade
        );
    }

    // 🚦 filtro status
    if (status) {
        filtradas = filtradas.filter(c =>
            getStatus(c) === status
        );
    }

    paginaAtual = 1;
    listaAtual = filtradas;

    renderizarPagina();
}

/* =============================
   CIDADES
============================= */

async function carregarCidadesSelect() {

    const res = await fetch(API_CITIES);
    const cidades = await res.json();

    const select = document.getElementById("citySelect");

    if (!select) return;

    select.innerHTML =
        `<option value="">Selecione a cidade</option>` +
        cidades.map(c =>
            `<option value="${c.id}">${c.name} - ${c.state}</option>`
        ).join("");
}

async function carregarFiltroCidades() {

    const res = await fetch(API_CITIES);
    const cidades = await res.json();

    const select = document.getElementById("filtroCidade");

    if (!select) return;

    select.innerHTML =
        `<option value="">Todas as cidades</option>` +
        cidades.map(c =>
            `<option value="${c.id}">
                ${c.name} - ${c.state}
            </option>`
        ).join("");
}

/* =============================
   UPLOAD
============================= */

async function uploadLogo() {

    const file = document.getElementById("logo")?.files[0];

    if (!file) return null;

    const formData = new FormData();
    formData.append("logo", file);

    const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Authorization": token },
        body: formData
    });

    const data = await res.json();

    return data.url;
}

/* =============================
   LISTAGEM
============================= */

function renderizarPagina() {

    const tbody = document.getElementById("lista");

    if (!tbody) return;

    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;

    const paginaItens = listaAtual.slice(inicio, fim);

    tbody.innerHTML = paginaItens.map(c => {

        const classe = getStatus(c) === "vencido" ? "table-danger" : "";

        return `
        <tr class="${classe}">
            <td>
                <img
                    src="/${c.logoImage ? c.logoImage : 'uploads/logos/placeholder-logo.png'}"
                    class="rounded"
                    style="width:80px"
                >
            </td>

            <td>${c.name}</td>

            <td>${getStatusBadge(c)}</td>

            <td>
                ${c.plan === "PAGO"
                    ? '<span class="badge bg-success">PAGO</span>'
                    : '<span class="badge bg-secondary">BONIFICADO</span>'}
            </td>

            <td>${c.phone || "-"}</td>
            <td>${c.whatsapp || "-"}</td>
            <td>${c.city_name || "-"}</td>

            <td>
                <button class="btn btn-sm btn-warning"
                    onclick="abrirEdicao(${c.id})">
                    Editar
                </button>

                <button class="btn btn-sm btn-danger"
                    onclick="confirmarExcluir(${c.id})">
                    Excluir
                </button>
            </td>
        </tr>
        `;

    }).join("");

    renderizarPaginacao();
}

/* =============================
   PAGINAÇÃO
============================= */

function renderizarPaginacao() {

    const totalPaginas =
        Math.ceil(listaAtual.length / itensPorPagina);

    const paginacao = document.getElementById("paginacao");

    if (!paginacao) return;

    let html = "";

    html += `
        <li class="page-item ${paginaAtual === 1 ? "disabled" : ""}">
            <button class="page-link"
                onclick="mudarPagina(${paginaAtual - 1})">
                Anterior
            </button>
        </li>
    `;

    for (let i = 1; i <= totalPaginas; i++) {
        html += `
            <li class="page-item ${i === paginaAtual ? "active" : ""}">
                <button class="page-link"
                    onclick="mudarPagina(${i})">
                    ${i}
                </button>
            </li>
        `;
    }

    html += `
        <li class="page-item ${paginaAtual === totalPaginas ? "disabled" : ""}">
            <button class="page-link"
                onclick="mudarPagina(${paginaAtual + 1})">
                Próximo
            </button>
        </li>
    `;

    paginacao.innerHTML = html;
}

function mudarPagina(pagina) {
    paginaAtual = pagina;
    renderizarPagina();
}

/* =============================
   CARREGAR
============================= */

async function carregar() {

    const res = await fetch(API);
    todasClinicas = await res.json();

    listaAtual = [...todasClinicas];

    renderizarPagina();
}

/* =============================
   SALVAR
============================= */

async function salvar(e) {

    e.preventDefault();

    const botao = e.target.querySelector("button[type='submit']");
    const textoOriginal = botao.innerHTML;

    try {

        botao.disabled = true;
        botao.innerHTML = "Salvando...";

        let logoUrl = await uploadLogo();

        const clinica = {
            city_id: citySelect.value,
            name: name.value,
            address: address.value,
            phone: phone.value,
            whatsapp: whatsapp.value,
            description: description.value,
            latitude: parseFloat(latitude.value),
            longitude: parseFloat(longitude.value),
            logoImage: logoUrl,
            visible: parseInt(document.getElementById("visible").value),
            plan: document.getElementById("plan").value,
            expiration_date: document.getElementById("expiration_date").value || null
        };

        const res = await fetch(API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            },
            body: JSON.stringify(clinica)
        });

        if (!res.ok) throw new Error();

        mostrarAlerta("Clínica cadastrada com sucesso!", "success");

        document.getElementById("formClinica").reset();

        await carregar();
        await carregarCidadesSelect();

    } catch (err) {
        alert("Erro ao cadastrar clínica");
    } finally {
        botao.disabled = false;
        botao.innerHTML = textoOriginal;
    }
}

/* =============================
   ALERTA
============================= */

function mostrarAlerta(msg, tipo = "success") {

    const alerta = document.getElementById("alerta");

    if (!alerta) return;

    alerta.className = `alert alert-${tipo}`;
    alerta.innerHTML = msg;
    alerta.classList.remove("d-none");

    setTimeout(() => {
        alerta.classList.add("d-none");
    }, 3000);
}

/* =============================
   EDIÇÃO
============================= */

async function abrirEdicao(id) {

    const res = await fetch(API);
    const clinicas = await res.json();

    const c = clinicas.find(x => x.id === id);

    document.getElementById("editId").value = c.id;
    document.getElementById("editName").value = c.name;
    document.getElementById("editVisible").value = c.visible ?? 1;
    document.getElementById("editPlan").value = c.plan ?? "BONIFICADO";
    document.getElementById("editExpiration").value = c.expiration_date || "";
    document.getElementById("editAddress").value = c.address;
    document.getElementById("editLatitude").value = c.latitude || "";
    document.getElementById("editLongitude").value = c.longitude || "";
    document.getElementById("editPhone").value = c.phone;
    document.getElementById("editWhatsapp").value = c.whatsapp;
    document.getElementById("editDescription").value = c.description;

    new bootstrap.Modal(document.getElementById("modalEditar")).show();
}

async function uploadLogoEdicao() {

    const file = document.getElementById("editLogo").files[0];
    if (!file) return null;

    const formData = new FormData();
    formData.append("logo", file);

    const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Authorization": token },
        body: formData
    });

    const data = await res.json();
    return data.url;
}

async function salvarEdicao() {

    const id = document.getElementById("editId").value;

    let novaLogo = await uploadLogoEdicao();

    const resAtual = await fetch(API);
    const lista = await resAtual.json();
    const atual = lista.find(x => x.id == id);

    const clinicaAtualizada = {
        name: document.getElementById("editName").value,
        visible: parseInt(document.getElementById("editVisible").value),
        plan: document.getElementById("editPlan").value,
        expiration_date: document.getElementById("editExpiration").value,
        address: document.getElementById("editAddress").value,
        phone: document.getElementById("editPhone").value,
        whatsapp: document.getElementById("editWhatsapp").value,
        description: document.getElementById("editDescription").value,
        latitude: parseFloat(document.getElementById("editLatitude").value),
        longitude: parseFloat(document.getElementById("editLongitude").value),
        logoImage: novaLogo ? novaLogo : atual.logoImage
    };

    await fetch(API + "/" + id, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        },
        body: JSON.stringify(clinicaAtualizada)
    });

    bootstrap.Modal.getInstance(document.getElementById("modalEditar")).hide();

    carregar();
}

/* =============================
   EXCLUIR
============================= */

async function confirmarExcluir(id) {

    if (!confirm("Excluir clínica?")) return;

    await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { "Authorization": token }
    });

    carregar();
}

/* =============================
   INIT
============================= */

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("formClinica")
        ?.addEventListener("submit", salvar);

    document.getElementById("buscaNome")
        ?.addEventListener("input", aplicarFiltros);

    document.getElementById("filtroCidade")
        ?.addEventListener("change", aplicarFiltros);

    document.getElementById("filtroStatus")
        ?.addEventListener("change", aplicarFiltros);

    carregar();
    carregarCidadesSelect();
    carregarFiltroCidades();

});