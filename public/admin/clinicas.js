// clinicas.js

const name = document.getElementById("name");
const address = document.getElementById("address");
const phone = document.getElementById("phone");
const whatsapp = document.getElementById("whatsapp");
const description = document.getElementById("description");


let paginaAtual = 1;
const itensPorPagina = 10;
let todasClinicas = [];

// CARREGAR CIDADES SELECT
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


// UPLOAD
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

function renderizarPagina() {

    const tbody = document.getElementById("lista");

    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;

    const paginaItens = todasClinicas.slice(inicio, fim);

    tbody.innerHTML = paginaItens.map(c => `
        <tr>
            <td>
                <img
                    src="/${c.logoImage ? c.logoImage : 'uploads/logos/placeholder-logo.png'}"
                    class="rounded"
                    style="width:80px"
                >
            </td>

            <td>${c.name}</td>

            <td>${c.phone || "-"}</td>

            <td>${c.whatsapp || "-"}</td>

            <td>${c.address || "-"}</td>

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
    `).join("");

    renderizarPaginacao();

}

// PAGINAÇÃO
function renderizarPaginacao() {

    const totalPaginas =
        Math.ceil(todasClinicas.length / itensPorPagina);

    const paginacao = document.getElementById("paginacao");

    let html = "";

    // botão anterior
    html += `
        <li class="page-item ${paginaAtual === 1 ? "disabled" : ""}">
            <button class="page-link"
                onclick="mudarPagina(${paginaAtual - 1})">
                Anterior
            </button>
        </li>
    `;

    // números
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

    // botão próximo
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

// LISTAR
async function carregar() {

    const res = await fetch(API);
    todasClinicas = await res.json();

    renderizarPagina();

}


// SALVAR
async function salvar(e) {

    e.preventDefault();

    const botao = e.target.querySelector("button[type='submit']");
    const textoOriginal = botao.innerHTML;

    try {

        // feedback visual
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
            logoImage: logoUrl

        };

        const res = await fetch(API, {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            },

            body: JSON.stringify(clinica)

        });

        if (!res.ok) {
            throw new Error("Erro ao salvar");
        }

        // ✅ mensagem sucesso
        mostrarAlerta("Clínica cadastrada com sucesso!", "success");

        // limpar formulário
        document.getElementById("formClinica").reset();

        // atualizar lista sem reload
        await carregar();

        // atualizar select
        await carregarCidadesSelect();

       

        // opcional: reload completo após 1s
        // setTimeout(() => location.reload(), 1000);

    }
    catch (err) {

        console.error(err);

        alert("❌ Erro ao cadastrar clínica");

    }
    finally {

        botao.disabled = false;
        botao.innerHTML = textoOriginal;

    }

}

function mostrarAlerta(msg, tipo = "success") {

    const alerta = document.getElementById("alerta");

    alerta.className = `alert alert-${tipo}`;

    alerta.innerHTML = msg;

    alerta.classList.remove("d-none");

    setTimeout(() => {

        alerta.classList.add("d-none");

    }, 3000);

}

//EDITAR
async function abrirEdicao(id) {
    const res = await fetch(API);
    const clinicas = await res.json();

    const c = clinicas.find(x => x.id === id);

    document.getElementById("editId").value = c.id;
    document.getElementById("editName").value = c.name;
    document.getElementById("editAddress").value = c.address;
    document.getElementById("editLatitude").value = c.latitude || "";
    document.getElementById("editLongitude").value = c.longitude || "";
    document.getElementById("editPhone").value = c.phone;
    document.getElementById("editWhatsapp").value = c.whatsapp;
    document.getElementById("editDescription").value = c.description;

    const modal = new bootstrap.Modal(document.getElementById("modalEditar"));
    modal.show();
}

//UPLOAD LOGO EDIÇÃO
async function uploadLogoEdicao() {
    const file = document.getElementById("editLogo").files[0];

    if (!file) return null;

    const formData = new FormData();
    formData.append("logo", file);

    const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
            "Authorization": token
        },
        body: formData
    });

    const data = await res.json();
    return data.url;
}

//SALVAR EDIÇÃO
async function salvarEdicao() {
    const id = document.getElementById("editId").value;

    let novaLogo = await uploadLogoEdicao();

    // Buscar dados atuais para manter logo antiga se não trocar
    const resAtual = await fetch(API);
    const lista = await resAtual.json();
    const atual = lista.find(x => x.id == id);

    const clinicaAtualizada = {
        name: document.getElementById("editName").value,
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

    const modal = bootstrap.Modal.getInstance(document.getElementById("modalEditar"));
    modal.hide();

    carregar();
}


// EXCLUIR
async function confirmarExcluir(id) {

    if (!confirm("Excluir clínica?")) return;

    await fetch(`${API}/${id}`, {

        method: "DELETE",

        headers: { "Authorization": token }

    });

    carregar();

}


// INIT
document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("formClinica");

    if (form) {
        form.addEventListener("submit", salvar);
    }

    carregar();

    carregarCidadesSelect();

});