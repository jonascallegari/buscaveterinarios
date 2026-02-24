(() => {
    'use strict';

    const API_BASE = "/api";
    const USER_COORDS_KEY = 'user_coords';

    let currentUserCoords = null;
    let currentClinics = [];

    function getCityDataFromUrl() {
        const parts = window.location.pathname.split('/').filter(Boolean);

        // Esperado: /sp/araras
        if (parts.length >= 2) {
            return {
                uf: parts[0].toLowerCase(),
                slug: parts[1].toLowerCase()
            };
        }

        return null;
    }

    function renderCards(clinics) {
        const container = document.getElementById('clinics-container');
        container.innerHTML = '';

        if (!clinics.length) {
            container.innerHTML = `
                <div class="col-12 text-center text-white">
                    <h4>Nenhuma clínica cadastrada nesta cidade ainda.</h4>
                </div>
            `;
            return;
        }

        clinics.forEach((clinic, idx) => {

            const distance = getDistanceFromUser(clinic);

            let distanceBadge = '';

            if (distance !== null) {
                distanceBadge = `
            <span class="badge bg-primary mb-1">
                📍 a ${distance.toFixed(1)} km de você
            </span>
        `;
            }
            const col = document.createElement('div');
            col.className = 'col-sm-8 col-12 text-center';
            col.style.order = idx;

            const card = document.createElement('div');
            card.className = 'card mb-3 shadow border-0';

            const logo = `
                <img 
                    src="/${clinic.logoImage ? clinic.logoImage : 'uploads/logos/placeholder-logo.jpg'}"
                    onerror="this.src='/uploads/logos/placeholder-logo.jpg'"
                    class="img-fluid rounded-start"
                    alt="Logotipo de ${clinic.name} em ${clinic.city_name}"
                    title="Logotipo de ${clinic.name} em ${clinic.city_name}"
                    object-fit:cover;"
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
                        <a href="/${clinic.city_state.toLowerCase()}/${clinic.city_slug}/${clinic.slug}">${logo}</a>
                    </div>
                    <div class="col-md-8">
                        <div class="card-body">
                            <h2 class="card-title fs-4 mb-1"><strong>${clinic.name}</strong></h2>

                            ${distanceBadge}

                            <p class="mb-1">${clinic.description || ""}</p>

                            <address class="mb-1">
                                <strong>${clinic.address || ""}</strong>
                            </address>

                            <div class="d-flex gap-2 justify-content-center">
                                <a class="btn btn-success btn-lg" href="${whatsappLink}" target="_blank" alt="Entrar em contato com ${clinic.name} por Whatsapp" title="Entrar em contato com ${clinic.name} por Whatsapp">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-whatsapp" viewBox="0 0 16 16">
                                    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                                    </svg> WhatsApp
                                </a>

                                <a class="btn btn-info btn-lg" href="${teleLink}" alt="Ligar para ${clinic.name}" title="Ligar para ${clinic.name}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-telephone" viewBox="0 0 16 16">
                                    <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 0 0 4.168 6.608 17.6 17.6 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.68.68 0 0 0-.58-.122l-2.19.547a1.75 1.75 0 0 1-1.657-.459L5.482 8.062a1.75 1.75 0 0 1-.46-1.657l.548-2.19a.68.68 0 0 0-.122-.58zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.68.68 0 0 0 .178.643l2.457 2.457a.68.68 0 0 0 .644.178l2.189-.547a1.75 1.75 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.6 18.6 0 0 1-7.01-4.42 18.6 18.6 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877z"/>
                                    </svg> Ligar
                                </a>                                

                                ${possuiLocalizacao(clinic)
                                    ? `<a class="btn btn-warning btn-lg"
                                            href="${mapsLink}"
                                            target="_blank"
                                            alt="Calcular rota para ${clinic.name}"
                                            title="Calcular rota para ${clinic.name}">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-cursor-fill" viewBox="0 0 16 16">
                                            <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z"/>
                                            </svg> Rotas
                                        </a>`
                                            : `<button class="btn btn-warning btn-lg" disabled title="Endereço ou coordenadas não informados">
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
        });
    }

    function possuiLocalizacao(clinic) {
        const temCoords =
            clinic.latitude &&
            clinic.longitude &&
            clinic.latitude !== "" &&
            clinic.longitude !== "";

        const temEndereco =
            clinic.address &&
            clinic.address.trim() !== "";

        return temCoords || temEndereco;
    }

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const toRad = v => (v * Math.PI) / 180;
        const R = 6371;

        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

    function sortByProximity(clinics, userCoords) {
        return clinics.slice().sort((a, b) => {

            if (!a.latitude || !a.longitude) return 1;
            if (!b.latitude || !b.longitude) return -1;

            const da = calculateDistance(
                userCoords.lat,
                userCoords.lon,
                a.latitude,
                a.longitude
            );

            const db = calculateDistance(
                userCoords.lat,
                userCoords.lon,
                b.latitude,
                b.longitude
            );

            return da - db;
        });
    }

    function sortAlphabetically(clinics) {
        return clinics.slice().sort((a, b) =>
            a.name.localeCompare(b.name, 'pt-BR')
        );
    }

    function loadUserCoords() {
        try {
            return JSON.parse(localStorage.getItem(USER_COORDS_KEY));
        } catch {
            return null;
        }
    }

    function getDistanceFromUser(clinic) {
        if (!currentUserCoords) return null;

        if (!clinic.latitude || !clinic.longitude) return null;

        return calculateDistance(
            currentUserCoords.lat,
            currentUserCoords.lon,
            clinic.latitude,
            clinic.longitude
        );
    }

    async function carregarClinicasDaCidade() {
        const cityData = getCityDataFromUrl();

        if (!cityData) {
            console.error("Cidade não encontrada na URL");
            return [];
        }

        const { uf, slug } = cityData;

        const resCity = await fetch(
            `${API_BASE}/cities/${uf}/${slug}`
        );

        if (!resCity.ok) {
            console.error("Cidade não encontrada");
            return [];
        }

        const city = await resCity.json();

        document.getElementById("tituloCidade").innerText = city.name;

        if (linkSobre) {
            linkSobre.setAttribute(
                "title",
                `Sobre o guia de veterinários, veterinárias e clínicas veterinárias em ${city.name}`
            );
        }
        
        // Atualiza todos os spans com a classe nomeCidade
        document.querySelectorAll(".nomeCidade").forEach(el => {
            el.innerText = city.name;
        });

        atualizarSEOComCidade(city);

        const resClinics = await fetch(
            `${API_BASE}/clinics/${uf}/${slug}`
        );

        return await resClinics.json();
    }

    function requestUserLocation() {
        if (!navigator.geolocation) {
            console.warn("Geolocalização não suportada");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };

                localStorage.setItem(USER_COORDS_KEY, JSON.stringify(coords));

                currentUserCoords = coords;

                renderCards(sortByProximity(currentClinics, currentUserCoords));
            },
            (error) => {
                console.warn("Usuário negou geolocalização ou ocorreu erro:", error);
            }
        );
    }

    function ordenarPorProximidadeComBotao() {
        const btn = document.getElementById("btnProximidade");

        btn.disabled = true;
        btn.innerText = "Obtendo sua localização...";

        if (!navigator.geolocation) {
            alert("Seu navegador não suporta geolocalização.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };

                localStorage.setItem(USER_COORDS_KEY, JSON.stringify(coords));

                currentUserCoords = coords;

                renderCards(sortByProximity(currentClinics, currentUserCoords));

                btn.disabled = false;
                btn.innerText = "📍 Ordenado por proximidade";
            },
            (error) => {
                alert("Não foi possível obter sua localização.");
                console.warn(error);

                btn.disabled = false;
                btn.innerText = "📍 Mostrar clínicas mais próximas de mim";
            }
        );
    }

    async function initializeApp() {
        currentClinics = await carregarClinicasDaCidade();

        currentUserCoords = loadUserCoords();

        if (currentUserCoords) {
            renderCards(sortByProximity(currentClinics, currentUserCoords));
        } else {
            renderCards(sortAlphabetically(currentClinics));
        }

        const btn = document.getElementById("btnProximidade");

        if (btn) {
            btn.addEventListener("click", ordenarPorProximidadeComBotao);
        }

        // Ordenação pelo select da página
        const orderSelect = document.querySelector("select[aria-label='order']");

        if (orderSelect) {
            orderSelect.addEventListener("change", (e) => {
                const tipo = e.target.value;

                if (tipo === "0") {
                    if (currentUserCoords) {
                        renderCards(sortByProximity(currentClinics, currentUserCoords));
                    }
                } else {
                    renderCards(sortAlphabetically(currentClinics));
                }
            });
        }

        // Tenta obter localização atualizada sempre que entra na página
        requestUserLocation();
    }

    function atualizarSEOComCidade(city) {

        const cityName = city.name;
        const citySlug = city.slug;
        const uf = city.state.toLowerCase();

        // TITLE
        document.title = `Veterinários em ${cityName} | Clínicas Veterinárias Próximas`;

        // META DESCRIPTION
        const description = document.querySelector('meta[name="description"]');
        if (description) {
            description.setAttribute(
                "content",
                `Encontre veterinários, veterinárias e clínicas veterinárias em ${cityName}. Veja os profissionais mais próximos, consultas, emergências e atendimento veterinário especializado.`
            );
        }

        // META KEYWORDS
        const keywords = document.querySelector('meta[name="keywords"]');
        if (keywords) {
            keywords.setAttribute(
                "content",
                `veterinários, veterinárias, clínicas veterinárias, veterinários em ${cityName}, clínicas veterinárias em ${cityName}, veterinário perto de mim, hospital veterinário`
            );
        }

        // Open Graph
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
            ogTitle.setAttribute(
                "content",
                `Veterinários em ${cityName} | Clínicas Veterinárias e Atendimento Pet`
            );
        }

        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) {
            ogDesc.setAttribute(
                "content",
                `Lista completa de clínicas veterinárias, hospitais e veterinários próximos em ${cityName}. Atendimento para cães, gatos e pets exóticos.`
            );
        }

        // Twitter
        const twitterTitle = document.querySelector('meta[name="twitter:title"]');
        if (twitterTitle) {
            twitterTitle.setAttribute(
                "content",
                `Veterinários em ${cityName} | Clínicas Veterinárias Próximas`
            );
        }

        const twitterDesc = document.querySelector('meta[name="twitter:description"]');
        if (twitterDesc) {
            twitterDesc.setAttribute(
                "content",
                `Encontre clínicas veterinárias e veterinários mais próximos em ${cityName} com atendimento completo para seu pet.`
            );
        }

        // Canonical dinâmico
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) {
            canonical.setAttribute(
                "href",
                `https://www.buscaclinicasveterinarias.com.br/${uf}/${citySlug}`
            );
        }

        // Atualizar JSON-LD (Schema)
        const schemaScript = document.querySelector('script[type="application/ld+json"]');

        if (schemaScript) {
            const schema = {
                "@context": "https://schema.org",
                "@type": "VeterinaryCare",
                "name": `Guia de Clínicas Veterinárias em ${cityName}`,
                "description": `Guia completo com clínicas veterinárias, veterinários e hospitais veterinários em ${cityName}`,
                "areaServed": {
                    "@type": "City",
                    "name": cityName
                },
                "serviceType": [
                    "Consulta veterinária",
                    "Emergência veterinária",
                    "Hospital veterinário",
                    "Atendimento veterinário 24 horas"
                ],
                "url": `https://www.buscaclinicasveterinarias.com.br/${uf}/${citySlug}`
            };

            // Título
            const tituloSobre = document.getElementById("tituloSobre");
            if (tituloSobre) {
                tituloSobre.innerText = `Guia de Veterinários e Clínicas Veterinárias em ${cityName}`;
            }

            // Alt e Title
            document.querySelectorAll("img").forEach(img => {
                if (img.alt) {
                    img.alt = img.alt.replace(/Rio Claro/gi, cityName);
                }

                if (img.title) {
                    img.title = img.title.replace(/Rio Claro/gi, cityName);
                }
            });

            schemaScript.textContent = JSON.stringify(schema);
        }
    }


    document.addEventListener('DOMContentLoaded', initializeApp);

})();
