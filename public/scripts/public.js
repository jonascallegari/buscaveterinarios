const API_CITIES = "/api/cities";

async function carregarCidadesPublico() {
    const res = await fetch(API_CITIES);
    const cidades = await res.json();

    document.getElementById("publicCitySelect").innerHTML =
        cidades.map(c =>
            `<option value="${c.state.toLowerCase()}/${c.slug}">
            ${c.name} - ${c.state}
            </option>`
        ).join("");
}

function verClinicasDaCidade() {
    const path = document.getElementById("publicCitySelect").value;
    window.location.href = `/${path}`;
}

async function carregarBotoesCidades() {

    const res = await fetch('/api/cities');
    const cidades = await res.json();

    const container = document.getElementById("botoesCidades");

    if (!container) return;

    container.innerHTML = cidades.map(c => `
    <a href="/${c.state.toLowerCase()}/${c.slug}" 
       class="btn btn-outline-light btn-lg m-1 rounded-5">
       ${c.name} - ${c.state}
    </a>
  `).join("");

}

document.addEventListener("DOMContentLoaded", carregarBotoesCidades);

carregarCidadesPublico();
