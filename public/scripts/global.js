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