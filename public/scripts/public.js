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

carregarCidadesPublico();
