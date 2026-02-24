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

                        <h1 class="card-title fs-4 mb-1">
                            <strong>${clinic.name}</strong>
                        </h1>

                        <p class="mb-1">${clinic.description || ""}</p>

                        <address>                            
                            <strong>${clinic.address || ""}</strong>
                        </address>
                          <hr class="mb-3 mt-2">
                        <div class="d-flex gap-2 justify-content-center flex-wrap">

                            <a class="btn btn-success btn-lg"
                               href="${whatsappLink}"
                               target="_blank"
                               title="Entrar em contato com ${clinic.name} por WhatsApp">
                                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-whatsapp" viewBox="0 0 16 16">
                                <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                                </svg> WhatsApp
                            </a>

                            <a class="btn btn-info btn-lg"
                               href="${teleLink}"
                               title="Ligar para ${clinic.name}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-telephone" viewBox="0 0 16 16">
                                <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 0 0 4.168 6.608 17.6 17.6 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.68.68 0 0 0-.58-.122l-2.19.547a1.75 1.75 0 0 1-1.657-.459L5.482 8.062a1.75 1.75 0 0 1-.46-1.657l.548-2.19a.68.68 0 0 0-.122-.58zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.68.68 0 0 0 .178.643l2.457 2.457a.68.68 0 0 0 .644.178l2.189-.547a1.75 1.75 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.6 18.6 0 0 1-7.01-4.42 18.6 18.6 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877z"/>
                                </svg> Ligar
                            </a>

                            ${possuiLocalizacao(clinic)
        ? `<a class="btn btn-warning btn-lg"
                                     href="${mapsLink}"
                                     target="_blank"
                                     title="Calcular rota para ${clinic.name}">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-cursor-fill" viewBox="0 0 16 16">
                                        <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z"/>
                                        </svg> Rotas
                                   </a>`
        : `<button class="btn btn-warning btn-lg" disabled>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-cursor-fill" viewBox="0 0 16 16">
                                        <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z"/>
                                        </svg> Rotas
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