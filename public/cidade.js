function getParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        id: params.get("id"),
        cidade: params.get("cidade")
    };
}

async function carregarClinicasDaCidade() {
    const { id, cidade } = getParams();

    document.getElementById("tituloCidade").innerText =
        "Clínicas em " + cidade;

    const res = await fetch(
        `/api/clinics/city/${id}`
    );

    const clinicas = await res.json();

    document.getElementById("listaClinicas").innerHTML =
        clinicas.map(c => `
        <div class="col-md-4 mb-3">
            <div class="card p-3">
                <h5>${c.name}</h5>
                <p>${c.address || ""}</p>
                <p>${c.phone || ""}</p>
            </div>
        </div>
    `).join("");
}

carregarClinicasDaCidade();
