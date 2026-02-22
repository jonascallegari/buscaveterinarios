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
                                <i class="fa fa-map-pin"></i> <strong>${clinic.address || ""}</strong>
                            </address>

                            <div class="d-flex gap-2 justify-content-center">
                                <a class="btn btn-success btn-lg" href="${whatsappLink}" target="_blank" alt="Entrar em contato com ${clinic.name} por Whatsapp" title="Entrar em contato com ${clinic.name} por Whatsapp">
                                    <i class="fab fa-whatsapp fa-lg"></i> WhatsApp
                                </a>

                                <a class="btn btn-info btn-lg" href="${teleLink}" alt="Ligar para ${clinic.name}" title="Ligar para ${clinic.name}">
                                    <i class="fa fa-phone fa-lg"></i> Ligar
                                </a>                                

                                ${possuiLocalizacao(clinic)
                                    ? `<a class="btn btn-warning btn-lg"
                                            href="${mapsLink}"
                                            target="_blank"
                                            alt="Calcular rota para ${clinic.name}"
                                            title="Calcular rota para ${clinic.name}">
                                            <i class="fa fa-location-arrow fa-lg"></i> Rotas
                                        </a>`
                                            : `<button class="btn btn-warning btn-lg" disabled title="Endereço ou coordenadas não informados">
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
