const API = '/api/clinics';
const API_CITIES = '/api/cities';

const token = localStorage.getItem("token");

if (!token) {
    window.location = "login.html";
}

const name = document.getElementById("name");
const address = document.getElementById("address");
const phone = document.getElementById("phone");
const whatsapp = document.getElementById("whatsapp");
const description = document.getElementById("description");

function logout() {
    localStorage.removeItem("token");
    window.location = "login.html";
}

//CARREGAR CIDADES
async function carregarCidades() {
    const res = await fetch(API_CITIES);
    const cidades = await res.json();

    document.getElementById("listaCidades").innerHTML =
        cidades.map(c => `
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

//SALVAR NOVA CIDADE
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

//EXCLUIR CIDADE
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
function confirmarExcluirCidade() {

    if (!cidadeIdParaExcluir) return;

    fetch(`${API_CITIES}/${cidadeIdParaExcluir}`, {
        method: "DELETE",
        headers: {
            "Authorization": token
        }
    })
        .then(res => {
            if (!res.ok) {
                throw new Error("Erro ao excluir cidade");
            }
            return res.json();
        })
        .then(() => {
            location.reload();
        })
        .catch(err => {
            console.error("Erro ao excluir cidade:", err);
            alert("Erro ao excluir cidade");
        });
}


//CARREGAR CIDADES NO ANUNCIANTE
async function carregarCidadesSelect() {
    const res = await fetch(API_CITIES);
    const cidades = await res.json();

    const select = document.getElementById("citySelect");

    select.innerHTML = `
        <option value="">Selecione a cidade</option>
    ` + cidades.map(c =>
        `<option value="${c.id}">${c.name} - ${c.state}</option>`
    ).join("");
}

//UPLOAD DA IMAGEM
async function uploadLogo() {
    const file = document.getElementById("logo").files[0];

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

//LISTAR ANUNCIANTES
async function carregar() {
    const res = await fetch(API);
    const data = await res.json();

    const tbody = document.getElementById('lista');

    tbody.innerHTML = data.map(c => `
    <tr>
      <td>
        <img
            src="/${c.logoImage ? c.logoImage : 'uploads/logos/placeholder-logo.png'}"
            onerror="this.src='/uploads/logos/placeholder-logo.jpg'"
            class="rounded"
            style="width:80px; height:auto;"
        >
      </td>

      <td>
        <strong>${c.name || "Sem nome"}</strong>
      </td>

      <td>
        ${c.phone || "-"}
      </td>

      <td>
        ${c.whatsapp || "-"}
      </td>

      <td style="max-width:250px;">
        ${c.address || "-"}
      </td>

      <td>
        <button class="btn btn-sm btn-warning me-2"
          onclick="abrirEdicao(${c.id})">
          ✏️ Editar
        </button>

        <button class="btn btn-sm btn-danger"
          onclick="confirmarExcluir(${c.id}, '${c.name}')">
          🗑 Excluir
        </button>
      </td>
    </tr>
  `).join('');

    
}


//CADASTRAR
async function salvar(e) {
    e.preventDefault();

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

    await fetch(API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        },
        body: JSON.stringify(clinica)
    });

    if (!citySelect.value) {
        alert("Selecione uma cidade antes de salvar.");
        return;
    }

    carregar();
    carregarCidadesSelect();
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

//DELETAR
async function excluir(id) {
    await fetch(API + "/" + id, { 
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        },
     });
    carregar();
}

async function confirmarExcluir(id) {
    if (!confirm("Tem certeza que deseja excluir esta clínica?")) {
        return;
    }

    const token = localStorage.getItem("token");

    const res = await fetch(`/api/clinics/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": token
        }
    });

    if (res.ok) {
        alert("Clínica excluída com sucesso!");
        carregarClinicas();
    } else {
        alert("Erro ao excluir clínica");
    }
}

document.getElementById("formSenha")
    .addEventListener("submit", async function (e) {

        e.preventDefault();

        const token = localStorage.getItem("token");

        const currentPassword = document.getElementById("currentPassword").value;
        const newPassword = document.getElementById("newPassword").value;

        const res = await fetch("/api/users/change-password", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert("Senha alterada com sucesso! Faça login novamente.");
            localStorage.removeItem("token");
            window.location = "login.html";
        } else {
            alert(data.error || "Erro ao alterar senha");
        }

    });

window.confirmarExcluir = confirmarExcluir;

document.getElementById("formCidade")
    .addEventListener("submit", salvarCidade);

carregarCidades();
carregarCidadesSelect(); 

document.getElementById("formClinica")
    .addEventListener("submit", salvar);

carregar();


