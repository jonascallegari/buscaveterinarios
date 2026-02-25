// cidades.js

// CARREGAR CIDADES
async function carregarCidades() {

    const res = await fetch(API_CITIES);
    const cidades = await res.json();

    const lista = document.getElementById("listaCidades");

    if (!lista) return;

    lista.innerHTML = cidades.map(c => `
        <tr>
            <td>${c.name}</td>
            <td>${c.state}</td>
            <td>
                <button class="btn btn-danger btn-sm"
                    onclick="abrirModalExcluirCidade(${c.id}, '${c.name}')">
                    Excluir
                </button>
            </td>
        </tr>
    `).join("");
}


// SALVAR CIDADE
async function salvarCidade(e) {

    e.preventDefault();

    const cidade = {
        name: cityName.value,
        state: cityState.value
    };

    await fetch(API_CITIES, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        },
        body: JSON.stringify(cidade)
    });

    cityName.value = "";
    cityState.value = "";

    carregarCidades();
}


// MODAL EXCLUIR
let cidadeIdParaExcluir = null;

function abrirModalExcluirCidade(id, nomeCidade) {

    cidadeIdParaExcluir = id;

    document.getElementById("textoConfirmacaoCidade").innerText =
        `Tem certeza que deseja excluir a cidade "${nomeCidade}"?`;

    const modal = new bootstrap.Modal(
        document.getElementById("modalExcluirCidade")
    );

    modal.show();
}


// CONFIRMAR EXCLUSÃO
function confirmarExcluirCidade() {

    if (!cidadeIdParaExcluir) return;

    fetch(`${API_CITIES}/${cidadeIdParaExcluir}`, {
        method: "DELETE",
        headers: {
            "Authorization": token
        }
    })
        .then(() => carregarCidades());
}


// INIT
document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("formCidade");

    if (form) {
        form.addEventListener("submit", salvarCidade);
    }

    carregarCidades();

});