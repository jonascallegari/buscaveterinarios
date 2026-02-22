(() => {
  'use strict';

  async function carregarClinica() {

    const parts = window.location.pathname.split('/').filter(Boolean);

    if (parts.length < 3) {
      document.body.innerHTML = "<h1>URL inválida</h1>";
      return;
    }

    const uf = parts[0];
    const citySlug = parts[1];
    const clinicSlug = parts[2];

    const res = await fetch(
      `/api/clinic/${uf}/${citySlug}/${clinicSlug}`
    );

    if (!res.ok) {
      document.body.innerHTML = `
                <div class="container text-center my-5">
                    <h1>Clínica não encontrada</h1>
                    <a href="/${uf}/${citySlug}" class="btn btn-primary mt-3">
                        Voltar para a cidade
                    </a>
                </div>
            `;
      return;
    }

    const clinic = await res.json();

    atualizarSEOClinica(clinic);

    renderSingleClinic(clinic);
  }

  function renderSingleClinic(clinic) {

    const container = document.getElementById('conteudoClinica');
    container.innerHTML = '';

    const col = document.createElement('div');
    col.className = 'col-sm-8 col-12 text-center mx-auto';

    const card = document.createElement('div');
    card.className = 'card mb-3 shadow border-0';

    const logo = `
            <img 
                src="/${clinic.logoImage ? clinic.logoImage : 'uploads/logos/placeholder-logo.jpg'}"
                onerror="this.src='/uploads/logos/placeholder-logo.jpg'"
                class="img-fluid rounded-start"
                alt="Logotipo de ${clinic.name} em ${clinic.city_name}"
                title="Logotipo de ${clinic.name} em ${clinic.city_name}"
            >
        `;

    const mapsLink = getGoogleMapsLink(
      clinic.address,
      clinic.latitude,
      clinic.longitude
    );

    const whatsappLink = getWhatsAppLink(
      clinic.whatsapp || clinic.phone,
      clinic.name
    );

    const teleLink = clinic.phone
      ? `tel:+${clinic.phone.replace(/\D/g, '')}`
      : '#';

    card.innerHTML = `
            <div class="row g-0">
                <div class="col-md-4">
                    ${logo}
                </div>
                <div class="col-md-8">
                    <div class="card-body">

                        <h1 class="card-title fs-3 mb-1">
                            <strong>${clinic.name}</strong>
                        </h1>

                        <p class="mb-1">${clinic.description || ""}</p>

                        <address>
                            <i class="fa fa-map-pin"></i>
                            <strong>${clinic.address || ""}</strong>
                        </address>
                          <hr class="mb-3 mt-2">
                        <div class="d-flex gap-2 justify-content-center flex-wrap">

                            <a class="btn btn-success btn-lg"
                               href="${whatsappLink}"
                               target="_blank"
                               title="Entrar em contato com ${clinic.name} por WhatsApp">
                                <i class="fab fa-whatsapp fa-lg"></i> WhatsApp
                            </a>

                            <a class="btn btn-info btn-lg"
                               href="${teleLink}"
                               title="Ligar para ${clinic.name}">
                                <i class="fa fa-phone fa-lg"></i> Ligar
                            </a>

                            ${possuiLocalizacao(clinic)
        ? `<a class="btn btn-warning btn-lg"
                                     href="${mapsLink}"
                                     target="_blank"
                                     title="Calcular rota para ${clinic.name}">
                                        <i class="fa fa-location-arrow fa-lg"></i> Rotas
                                   </a>`
        : `<button class="btn btn-warning btn-lg" disabled>
                                        <i class="fa fa-location-arrow fa-lg"></i> Rotas
                                   </button>`
      }

                        </div>

                    </div>
                </div>
            </div>
        `;

    col.appendChild(card);
    container.appendChild(col);
  }

  function possuiLocalizacao(clinic) {
    return (
      (clinic.latitude && clinic.longitude) ||
      (clinic.address && clinic.address.trim() !== "")
    );
  }

  function getWhatsAppLink(phone, clinicName) {
    if (!phone) return '#';

    const digits = phone.replace(/\D/g, '');
    const phoneParam = digits.startsWith('55')
      ? digits
      : '55' + digits;

    const message =
      `Olá. Visitei seu anúncio no Busca Veterinários e gostaria de saber mais sobre ${clinicName}.`;

    return `https://api.whatsapp.com/send?phone=${phoneParam}&text=${encodeURIComponent(message)}`;
  }

  function getGoogleMapsLink(address, lat, lon) {
    if (lat && lon) return `https://www.google.com/maps?q=${lat},${lon}`;
    if (address) return `https://www.google.com/maps?q=${encodeURIComponent(address)}`;
    return '#';
  }

  function atualizarSEOClinica(clinic) {

    const uf = clinic.city_state.toLowerCase();
    const citySlug = clinic.city_slug;

    document.title = `${clinic.name} em ${clinic.city_name} | Veterinário`;

    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute(
        "content",
        `${clinic.name} - ${clinic.description || "Clínica veterinária em " + clinic.city_name}. Veja telefone, WhatsApp e localização.`
      );
    }

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute(
        "href",
        `https://www.buscaclinicasveterinarias.com.br/${uf}/${citySlug}/${clinic.slug}`
      );
    }
  }

  document.addEventListener('DOMContentLoaded', carregarClinica);

})();