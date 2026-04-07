const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./app/database');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const sharp = require("sharp");
const path = require('path');
const fs = require("fs");

const citiesRoutes = require("./app/routes/cities");

const SECRET = "chave-secreta-super-segura";
const app = express();

// ---- MIDDLEWARES GLOBAIS ----
app.use(cors());
app.use(bodyParser.json());

/* =====================================================
   STATIC FILES
===================================================== */
app.use(express.static(path.join(__dirname, 'public')));

/* =====================================================
   FUNÇÃO GERAR SLUG
===================================================== */
function gerarSlug(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

db.all("SELECT id, name FROM clinics WHERE slug IS NULL OR slug = ''", [], (err, rows) => {

  if (rows.length > 0) {
    console.log("Gerando slugs para clínicas antigas...");

    rows.forEach(clinic => {
      const slug = gerarSlug(clinic.name);

      db.run(
        "UPDATE clinics SET slug = ? WHERE id = ?",
        [slug, clinic.id]
      );
    });
  }
});

// =============================
// ROTA AMIGÁVEL
// =============================

// Página individual da clínica
app.get('/:uf/:citySlug/:clinicSlug', (req, res, next) => {

  if (
    req.params.uf === 'api' ||
    req.params.clinicSlug.includes('.')
  ) return next();

  const { uf, citySlug, clinicSlug } = req.params;

  db.get(
    "SELECT * FROM cities WHERE slug = ? AND LOWER(state) = LOWER(?)",
    [citySlug, uf],
    (err, city) => {

      if (err || !city) {
        return res.sendFile(path.join(__dirname, 'public/clinica.html'));
      }

      const cityName = city.name;

      // 👉 OPCIONAL (RECOMENDADO): buscar a clínica também
      db.get(
        `
        SELECT clinics.*, cities.name as city_name
        FROM clinics
        JOIN cities ON clinics.city_id = cities.id
        WHERE clinics.slug = ?
        AND cities.slug = ?
        AND LOWER(cities.state) = LOWER(?)
        `,
        [clinicSlug, citySlug, uf],
        (err2, clinic) => {

          if (err2 || !clinic) {
            return res.sendFile(path.join(__dirname, 'public/clinica.html'));
          }

          const clinicName = clinic.name;

          const html = `
        <!doctype html>
<html lang="pt-br">

<head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-1JWEKM49GK"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-1JWEKM49GK');
</script>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- SEO Básico -->
    <meta name="author" content="Panda Pix" />

    <title>${clinicName} em ${cityName} | Clínicas Veterinária Próxima</title>

    <meta name="description" content="Encontre veterinários, veterinárias e clínicas veterinárias em ${cityName}. Veja os veterinários mais próximos de você, consultas, emergências e atendimento veterinário especializado." />

    <!-- Keywords (Bing auxiliar) -->
    <meta name="keywords" content="veterinários, veterinárias, clínicas veterinárias, veterinários em ${cityName}, clínicas veterinárias em ${cityName}, veterinário perto de mim, hospital veterinário, emergência veterinária" />

    <!-- Robots -->
    <meta name="robots" content="index, follow, max-image-preview:large" />

    <!-- Canonical -->
    <link rel="canonical" href="https://www.pandapix.com.br/veterinarios/" />

    <!-- Open Graph (IA + redes sociais) -->
    <meta property="og:title" content="Veterinários em ${cityName} | Clínicas Veterinárias e Atendimento Pet" />
    <meta property="og:description" content="Lista completa de clínicas veterinárias, hospitais veterinários e veterinários próximos em ${cityName}. Atendimento para cães, gatos e pets exóticos." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://www.pandapix.com.br/veterinarios/" />
    <meta property="og:image" content="https://www.pandapix.com.br" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Veterinários em ${cityName} | Clínicas Veterinárias Próximas">
    <meta name="twitter:description" content="Encontre clínicas veterinárias e veterinários mais próximos em ${cityName} com atendimento completo para seu pet.">

    <!-- CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
    <link href="/assets/css/style.css" rel="stylesheet">

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/assets/img/favicon.png" />

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet">

    <!-- Schema Local SEO + IA -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "VeterinaryCare",
      "name": "Guia de Clínicas Veterinárias em ${cityName}",
      "description": "Guia completo com clínicas veterinárias, veterinários e hospitais veterinários em ${cityName}",
      "areaServed": {
        "@type": "City",
        "name": "cityName"
      },
      "serviceType": [
        "Consulta veterinária",
        "Emergência veterinária",
        "Hospital veterinário",
        "Atendimento veterinário 24 horas"
      ],
      "url": "https://www.pandapix.com.br/veterinarios/"
    }
    </script>

</head>

<body>
<!-- Navigation-->
<nav class="navbar navbar-expand-lg bg-transparent" id="mainNav">
    <div class="container-fluid">            
        <a class="navbar-brand js-scroll-trigger" href="https://buscaclinicasveterinarias.com.br/"
           title="Veterinários, veterinárias e clínicas veterinárias em ${cityName}">
            <img src="/assets/img/logo-veterinarios.png" class="img-fluid"
                 title="Guia de veterinários e clínicas veterinárias em ${cityName}"
                 alt="Guia de clínicas veterinárias e veterinários em ${cityName} ${uf}" />
        </a>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup"
            aria-controls="navbarNavAltMarkup" aria-expanded="false"
            aria-label="Abrir menu de clínicas veterinárias e veterinários em em ${cityName}">
            <span class="navbar-toggler-icon"></span>
        </button>    

        <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
            <div class="navbar-nav me-auto mt-2 text-shadow">

                <a id="linkSobre" class="nav-link js-scroll-trigger link-light" href="#sobre" title="">
                    Sobre
                </a>

            </div>
        </div>

        <div class="col-md-3 col-12 d-flex justify-content-end align-items-center">

            <!-- WhatsApp -->
            <a class="btn btn-success text-uppercase"
               onclick="return gtag_report_conversion('https://api.whatsapp.com/send?phone=551930233654&text=Ol%C3%A1.%20Vi%20seu%20site%20e%20gostaria%20de%20saber%20mais.');"
               href="https://api.whatsapp.com/send?phone=551930233654&text=Ol%C3%A1.%20Gostaria%20de%20anunciar%20no%20Veterin%C3%A1rios%20."
               title="Anunciar no guia de veterinários e clínicas veterinárias">
               
                <strong>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-whatsapp"
                        viewBox="0 0 16 16">
                        <path
                            d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
                    </svg>
                    <span class="d-mobile-none">ANUNCIE AQUI!</span>
                </strong>

            </a>

        </div>

    </div>
</nav>

<div id="carouselExampleIndicators" class="carousel" data-ride="carousel">

    <div class="carousel-inner z-n1 position-absolute top-negative">

        <div class="carousel-item active text-light" data-interval="2500">

            <img class="d-none d-sm-block d-sm-none d-md-block w-100"
                 src="/assets/img/fundo-veterinario.jpg"
                 alt="Clínicas veterinárias e veterinários em ${cityName} ${uf} atendimento para pets"
                 title="Clínicas veterinárias e veterinários em ${cityName} ${uf} atendimento veterinário completo">

            <img class="d-sm-block d-md-none w-100 mt-5"
                 src="/assets/img/fundo-veterinario-cel.jpg"
                 alt="Veterinários em ${cityName} atendimento veterinário próximo de você"
                 title="Veterinários mais próximos em ${cityName} atendimento pet especializado">
        </div>  

    </div>
</div>


    <section class="container top-space">
        <div class="row justify-content-center">
            <div class="col-sm-6 col-12 text-center">
                <img src="/assets/img/alerta.jpg" alt="" class="img-fluid rounded mb-5">

            <div class="text-shadow">
                <h2 class="text-light">
                    <strong>
                        Clínica Veterinária e Veterinário em <span id="tituloCidade">${cityName}</span>
                    </strong>
                </h2>
            </div>                
           
        </div>

        <div class="row mt-4 justify-content-center">
            <div id="conteudoClinica"></div>
        </div>
    </section>

    <section class="bg-image">
        <div class="container">
<div class="row" id="sobre">
    <div class="col-md-3">
        <img src="/assets/img/cachorro.png" 
             alt="Veterinários em ${cityName} ${uf} atendimento clínico veterinário para cães gatos e pets"
             title="Clínicas veterinárias em ${cityName} ${uf} atendimento veterinário completo para pets"
             class="img-fluid">
    </div>

    <div class="col-md-7 padding-top-space text-white">
        <h2 id="tituloSobre">Guia de Veterinários e Clínicas Veterinárias em ${cityName}</h2>

        <h3>Criado para Conectar Tutores e Veterinários</h3>

        <p>
            O site <strong>Veterinários em <span class="nomeCidade">${cityName}</span></strong> foi desenvolvido para ajudar tutores a encontrar 
            <strong>veterinários, clínicas veterinárias e hospitais veterinários em <span class="nomeCidade">${cityName}</span> ${uf}</strong> 
            com rapidez e segurança.
        </p>

        <p>
            Aqui você encontra uma seleção criteriosa de <strong>veterinários em <span class="nomeCidade">${cityName}</span></strong>, com informações claras, 
            atualizadas e de fácil acesso, facilitando a busca por 
            <strong>clínicas veterinárias próximas</strong> e pelo melhor atendimento para seu pet.
        </p>

        <p>
            Nosso objetivo é valorizar e divulgar <strong>clínicas veterinárias de qualidade</strong>, ao mesmo tempo em que 
            oferecemos conteúdo otimizado para Google, Bing e inteligências artificiais de busca, garantindo 
            <strong>maior visibilidade online</strong> e fortalecendo a 
            <strong>presença digital dos veterinários em <span class="nomeCidade">${cityName}</span> e região</strong>.
        </p>
        <h5>Conheça todas as cidades:</h5>
        <div id="botoesCidades" class="mt-4"></div>
    </div>
</div>    
            <hr class="my-5">

            <footer>
                <div class="row pb-5 justify-content-center">
                    <div class="col-md-2 col-6">
                        <img src="/assets/img/logo-veterinarios-branco.png" class="card-img opacity-75" alt="Veterinários em ${cityName}">
                    </div>
                </div>
            </footer>
            
            
        </div>
    </section>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

    <!-- Third party plugin JS-->
    <script src="/https://cdnjs.cloudflare.com/ajax/libs/jquery-easing/1.4.1/jquery.easing.min.js"></script>
    
    <!-- Core theme JS-->
    <script src="/assets/js/scripts.js"></script>

    <!-- Ordenação dinâmica de anunciantes -->
    <script src="/cidade-app.js"></script>
    <script src="/clinica.js"></script>
    <script src="/scripts/global.js"></script>
</body>

</html>
      `;

      res.send(html);
    }
      );
    }
  );
});

// Página da cidade
app.get('/:uf/:slug', (req, res, next) => {

  if (req.params.uf === 'api') return next();

  const { uf, slug } = req.params;

  db.get(
    "SELECT * FROM cities WHERE slug = ? AND LOWER(state) = LOWER(?)",
    [slug, uf],
    (err, city) => {

      if (err || !city) {
        return res.sendFile(path.join(__dirname, 'public/cidade.html'));
      }

      const cityName = city.name;

      const html = `
        <!doctype html>
<html lang="pt-br">

<head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-1JWEKM49GK"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-1JWEKM49GK');
</script>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- SEO Básico -->
    <meta name="author" content="Panda Pix" />

    <title>Veterinários em ${cityName} | Clínicas Veterinárias Próximas</title>

    <meta name="description" content="Encontre veterinários, veterinárias e clínicas veterinárias em ${cityName}. Veja os veterinários mais próximos de você, consultas, emergências e atendimento veterinário especializado." />

    <!-- Keywords (Bing auxiliar) -->
    <meta name="keywords" content="veterinários, veterinárias, clínicas veterinárias, veterinários em ${cityName}, clínicas veterinárias em ${cityName}, veterinário perto de mim, hospital veterinário, emergência veterinária" />

    <!-- Robots -->
    <meta name="robots" content="index, follow, max-image-preview:large" />

    <!-- Canonical -->
    <link rel="canonical" href="https://www.pandapix.com.br/veterinarios/" />

    <!-- Open Graph (IA + redes sociais) -->
    <meta property="og:title" content="Veterinários em ${cityName} | Clínicas Veterinárias e Atendimento Pet" />
    <meta property="og:description" content="Lista completa de clínicas veterinárias, hospitais veterinários e veterinários próximos em ${cityName}. Atendimento para cães, gatos e pets exóticos." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://www.pandapix.com.br/veterinarios/" />
    <meta property="og:image" content="https://www.pandapix.com.br" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Veterinários em ${cityName} | Clínicas Veterinárias Próximas">
    <meta name="twitter:description" content="Encontre clínicas veterinárias e veterinários mais próximos em ${cityName} com atendimento completo para seu pet.">

    <!-- CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
    <link href="/assets/css/style.css" rel="stylesheet">

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/assets/img/favicon.png" />

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet">

    <!-- Schema Local SEO + IA -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "VeterinaryCare",
      "name": "Guia de Clínicas Veterinárias em ${cityName}",
      "description": "Guia completo com clínicas veterinárias, veterinários e hospitais veterinários em ${cityName}",
      "areaServed": {
        "@type": "City",
        "name": "cityName"
      },
      "serviceType": [
        "Consulta veterinária",
        "Emergência veterinária",
        "Hospital veterinário",
        "Atendimento veterinário 24 horas"
      ],
      "url": "https://www.pandapix.com.br/veterinarios/"
    }
    </script>

</head>

<body>
<!-- Navigation-->
<nav class="navbar navbar-expand-lg bg-transparent" id="mainNav">
    <div class="container-fluid">            
        <a class="navbar-brand js-scroll-trigger" href="https://buscaclinicasveterinarias.com.br/"
           title="Veterinários, veterinárias e clínicas veterinárias em ${cityName}">
            <img src="/assets/img/logo-veterinarios.png" class="img-fluid"
                 title="Guia de veterinários e clínicas veterinárias em ${cityName}"
                 alt="Guia de clínicas veterinárias e veterinários em ${cityName} ${uf}" />
        </a>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup"
            aria-controls="navbarNavAltMarkup" aria-expanded="false"
            aria-label="Abrir menu de clínicas veterinárias e veterinários em em ${cityName}">
            <span class="navbar-toggler-icon"></span>
        </button>    

        <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
            <div class="navbar-nav me-auto mt-2 text-shadow">

                <a id="linkSobre" class="nav-link js-scroll-trigger link-light" href="#sobre" title="">
                    Sobre
                </a>

            </div>
        </div>

        <div class="col-md-3 col-12 d-flex justify-content-end align-items-center">

            <!-- WhatsApp -->
            <a class="btn btn-success text-uppercase"
               onclick="return gtag_report_conversion('https://api.whatsapp.com/send?phone=551930233654&text=Ol%C3%A1.%20Vi%20seu%20site%20e%20gostaria%20de%20saber%20mais.');"
               href="https://api.whatsapp.com/send?phone=551930233654&text=Ol%C3%A1.%20Gostaria%20de%20anunciar%20no%20Veterin%C3%A1rios%20."
               title="Anunciar no guia de veterinários e clínicas veterinárias">
               
                <strong>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-whatsapp"
                        viewBox="0 0 16 16">
                        <path
                            d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
                    </svg>
                    <span class="d-mobile-none">ANUNCIE AQUI!</span>
                </strong>

            </a>

        </div>

    </div>
</nav>

<div id="carouselExampleIndicators" class="carousel" data-ride="carousel">

    <div class="carousel-inner z-n1 position-absolute top-negative">

        <div class="carousel-item active text-light" data-interval="2500">

            <img class="d-none d-sm-block d-sm-none d-md-block w-100"
                 src="/assets/img/fundo-veterinario.jpg"
                 alt="Clínicas veterinárias e veterinários em ${cityName} ${uf} atendimento para pets"
                 title="Clínicas veterinárias e veterinários em ${cityName} ${uf} atendimento veterinário completo">

            <img class="d-sm-block d-md-none w-100 mt-5"
                 src="/assets/img/fundo-veterinario-cel.jpg"
                 alt="Veterinários em ${cityName} atendimento veterinário próximo de você"
                 title="Veterinários mais próximos em ${cityName} atendimento pet especializado">
        </div>  

    </div>
</div>


    <section class="container top-space">
        <div class="row justify-content-center">
            <div class="col-sm-6 col-12 text-center">
                <img src="/assets/img/alerta.jpg" alt="" class="img-fluid rounded mb-2">

            <div class="text-shadow">
                <h1 class="text-light">
                    <strong>
                        Encontre Clínicas Veterinárias e Veterinários em <br> <span id="tituloCidade">${cityName}</span>
                    </strong>
                </h1>
            </div>

                <div class="text-center mb-3">
                    <button id="btnProximidade" class="btn btn-outline-light rounded-pill">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-cursor-fill"
                            viewBox="0 0 16 16">
                            <path
                                d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z" />
                        </svg> Atualizar localização
                    </button>
                </div>
                <label for="order"><p class="fw-bold lead text-white text-shadow">Ordenar por:</p></label>
                <select class="form-select form-select-lg mb-3 shadow" aria-label="order">
                    <option value="0" selected>Mais Perto</option>
                    <option value="1">Ordem Alfabética</option>
                </select>
            </div>
        </div>

        <div class="row mt-4 justify-content-center">
            <div class="row justify-content-center" id="clinics-container"></div><!-- Cards renderizados dinamicamente -->
        </div>
    </section>

    <section class="bg-image">
        <div class="container">
<div class="row" id="sobre">
    <div class="col-md-3">
        <img src="/assets/img/cachorro.png" 
             alt="Veterinários em ${cityName} ${uf} atendimento clínico veterinário para cães gatos e pets"
             title="Clínicas veterinárias em ${cityName} ${uf} atendimento veterinário completo para pets"
             class="img-fluid">
    </div>

    <div class="col-md-7 padding-top-space text-white">
        <h2 id="tituloSobre">Guia de Veterinários e Clínicas Veterinárias em ${cityName}</h2>

        <h3>Criado para Conectar Tutores e Veterinários</h3>

        <p>
            O site <strong>Veterinários em <span class="nomeCidade">${cityName}</span></strong> foi desenvolvido para ajudar tutores a encontrar 
            <strong>veterinários, clínicas veterinárias e hospitais veterinários em <span class="nomeCidade">${cityName}</span> ${uf}</strong> 
            com rapidez e segurança.
        </p>

        <p>
            Aqui você encontra uma seleção criteriosa de <strong>veterinários em <span class="nomeCidade">${cityName}</span></strong>, com informações claras, 
            atualizadas e de fácil acesso, facilitando a busca por 
            <strong>clínicas veterinárias próximas</strong> e pelo melhor atendimento para seu pet.
        </p>

        <p>
            Nosso objetivo é valorizar e divulgar <strong>clínicas veterinárias de qualidade</strong>, ao mesmo tempo em que 
            oferecemos conteúdo otimizado para Google, Bing e inteligências artificiais de busca, garantindo 
            <strong>maior visibilidade online</strong> e fortalecendo a 
            <strong>presença digital dos veterinários em <span class="nomeCidade">${cityName}</span> e região</strong>.
        </p>
        <h5>Conheça todas as cidades:</h5>
        <div id="botoesCidades" class="mt-4"></div>
    </div>
</div>    
            <hr class="my-5">

            <footer>
                <div class="row pb-5 justify-content-center">
                    <div class="col-md-2 col-6">
                        <img src="/assets/img/logo-veterinarios-branco.png" class="card-img opacity-75" alt="Veterinários em ${cityName}">
                    </div>
                </div>
            </footer>
            
            
        </div>
    </section>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

    <!-- Third party plugin JS-->
    <script src="/https://cdnjs.cloudflare.com/ajax/libs/jquery-easing/1.4.1/jquery.easing.min.js"></script>
    
    <!-- Core theme JS-->
    <script src="/assets/js/scripts.js"></script>

    <!-- Ordenação dinâmica de anunciantes -->

    <script src="/cidade-app.js"></script>
    <script src="/scripts/global.js"></script>
</body>

</html>
      `;

      res.send(html);
    }
  );
});

/* =====================================================
   ROTAS API
===================================================== */
app.use("/api/cities", citiesRoutes);

// Buscar cidade pelo slug
app.get('/api/cities/:uf/:slug', (req, res) => {

  const { uf, slug } = req.params;

  db.get(
    "SELECT * FROM cities WHERE slug = ? AND LOWER(state) = LOWER(?)",
    [slug, uf],
    (err, city) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!city) return res.status(404).json({ error: "Cidade não encontrada" });

      res.json(city);
    }
  );
});

/* ===== Buscar clínicas da cidade ===== */
app.get('/api/clinics/:uf/:slug', (req, res) => {

  const { uf, slug } = req.params;

  const sql = `
    SELECT 
      clinics.*,
      cities.name AS city_name,
      cities.slug AS city_slug,
      cities.state AS city_state
    FROM clinics
    JOIN cities ON clinics.city_id = cities.id
    WHERE cities.slug = ?
    AND LOWER(cities.state) = LOWER(?)
    AND clinics.visible = 1
  `;

  db.all(sql, [slug, uf], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });

});

/* ===== Buscar clínica individual ===== */
app.get('/api/clinic/:uf/:citySlug/:clinicSlug', (req, res) => {

  const { uf, citySlug, clinicSlug } = req.params;

  const sql = `
    SELECT 
      clinics.*,
      cities.name AS city_name,
      cities.slug AS city_slug,
      cities.state AS city_state
    FROM clinics
    JOIN cities ON clinics.city_id = cities.id
    WHERE clinics.slug = ?
      AND cities.slug = ?
      AND LOWER(cities.state) = LOWER(?)
      AND clinics.visible = 1
  `;

  db.get(sql, [clinicSlug, citySlug, uf], (err, row) => {

    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Clínica não encontrada" });

    res.json(row);
  });
});

/* =====================================================
   AUTH
===================================================== */
function authMiddleware(req, res, next) {
  const token = req.headers.authorization;

  if (!token)
    return res.status(401).json({ error: "Token não informado" });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}

/* =====================================================
   UPLOAD LOGO
===================================================== */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
});

app.post("/api/upload", authMiddleware, upload.single("logo"), async (req, res) => {

  if (!req.file) {
    return res.status(400).json({ error: "Arquivo não enviado" });
  }

  try {

    const uploadDir = path.join(__dirname, "public/uploads/logos");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = Date.now() + ".webp";
    const filePath = path.join(uploadDir, fileName);

    await sharp(req.file.buffer)
      .resize({ width: 400 })
      .webp({ quality: 80 })
      .toFile(filePath);

    res.json({ url: "uploads/logos/" + fileName });

  } catch (err) {
    console.error("Erro no upload:", err);
    res.status(500).json({ error: "Erro ao processar imagem" });
  }
});

/* =====================================================
   LOGIN
===================================================== */
app.post('/api/login', (req, res) => { 

  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (!user) return res.status(401).json({ error: "Usuário inválido" });

    const valid = bcrypt.compareSync(password, user.password);

    if (!valid) return res.status(401).json({ error: "Senha inválida" });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token });
  });
});

// ALTERAR SENHA DO USUÁRIO LOGADO
app.put('/api/users/change-password', authMiddleware, (req, res) => {

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Preencha todos os campos" });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ error: "Nova senha muito curta" });
  }

  // Buscar usuário atual
  db.get("SELECT * FROM users WHERE id = ?", [req.user.id], (err, user) => {

    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    // Verifica senha atual
    const senhaValida = bcrypt.compareSync(currentPassword, user.password);

    if (!senhaValida) {
      return res.status(401).json({ error: "Senha atual incorreta" });
    }

    // Criptografa nova senha
    const hashed = bcrypt.hashSync(newPassword, 10);

    db.run(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashed, req.user.id],
      function (err) {

        if (err) return res.status(500).json({ error: err.message });

        res.json({
          success: true,
          message: "Senha alterada com sucesso"
        });
      }
    );
  });

});

// LISTAR CLÍNICAS POR CIDADE
app.get('/api/clinics/city/:cityId', (req, res) => {

  const sql = `
    SELECT 
      clinics.*,
      cities.name AS city_name,
      cities.state AS city_state
    FROM clinics
    LEFT JOIN cities ON clinics.city_id = cities.id
    WHERE clinics.city_id = ?
    AND clinics.visible = 1
  `;

  db.all(sql, [req.params.cityId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });

});

// LISTAR CLÍNICAS
app.get('/api/clinics', (req, res) => {

  const sql = `
    SELECT 
      clinics.*,
      cities.name AS city_name,
      cities.state AS city_state
    FROM clinics
    LEFT JOIN cities ON clinics.city_id = cities.id
    ORDER BY clinics.id DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });

});

/* =====================================================
   CRUD CLÍNICAS
===================================================== */

// CRIAR
app.post('/api/clinics', authMiddleware, (req, res) => {

  const c = req.body;
  const slug = gerarSlug(c.name);

  // 👉 DATA DE VALIDADE
  let expiration = c.expiration_date;

  if (!expiration) {
    const hoje = new Date();
    hoje.setFullYear(hoje.getFullYear() + 1);
    expiration = hoje.toISOString().split("T")[0]; // YYYY-MM-DD
  }

  db.run(
    `INSERT INTO clinics 
     (city_id, name, slug, description, address, phone, whatsapp, latitude, longitude, logoImage, visible, plan, expiration_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [c.city_id, c.name, slug, c.description, c.address, c.phone, c.whatsapp, c.latitude, c.longitude, c.logoImage, c.visible ?? 1, c.plan ?? "BONIFICADO", expiration],
    function () {
      res.json({ id: this.lastID });
    }
  );
});

// ATUALIZAR
app.put('/api/clinics/:id', authMiddleware, (req, res) => {

  const c = req.body;
  const slug = gerarSlug(c.name);
  const clinicId = req.params.id;

  // 1️⃣ Buscar logo atual no banco
  db.get("SELECT logoImage FROM clinics WHERE id = ?", [clinicId], (err, clinicAtual) => {

    if (err) return res.status(500).json({ error: err.message });
    if (!clinicAtual) return res.status(404).json({ error: "Clínica não encontrada" });

    const logoAntiga = clinicAtual.logoImage;

    // 2️⃣ Atualizar dados
    db.run(
      `UPDATE clinics SET 
        name=?, slug=?, description=?, address=?, phone=?, whatsapp=?, latitude=?, longitude=?, logoImage=?,
       visible=?, plan=?, expiration_date=? WHERE id=?`,
      [c.name, slug, c.description, c.address, c.phone, c.whatsapp, c.latitude, c.longitude, c.logoImage, c.visible, c.plan, c.expiration_date, clinicId],
      function (err) {

        if (err) return res.status(500).json({ error: err.message });

        // 3️⃣ Se houver nova logo diferente da antiga, apagar antiga
        if (c.logoImage && logoAntiga && logoAntiga !== c.logoImage) {

          const caminhoAntigo = path.join(__dirname, "public", logoAntiga);

          if (fs.existsSync(caminhoAntigo)) {
            fs.unlink(caminhoAntigo, (err) => {
              if (err) {
                console.error("Erro ao apagar logo antiga:", err);
              } else {
                console.log("Logo antiga removida com sucesso");
              }
            });
          }
        }

        res.json({ updated: true });
      }
    );
  });
});

// EXCLUIR CLÍNICA + LOGO
app.delete('/api/clinics/:id', authMiddleware, (req, res) => {

  const clinicId = req.params.id;

  // 1️⃣ Buscar logo atual
  db.get("SELECT logoImage FROM clinics WHERE id = ?", [clinicId], (err, clinic) => {

    if (err) return res.status(500).json({ error: err.message });
    if (!clinic) return res.status(404).json({ error: "Clínica não encontrada" });

    const logo = clinic.logoImage;

    // 2️⃣ Apagar arquivo se existir
    if (logo) {

      const caminhoLogo = path.join(__dirname, "public", logo);

      if (fs.existsSync(caminhoLogo)) {
        fs.unlink(caminhoLogo, (err) => {
          if (err) {
            console.error("Erro ao apagar logo:", err);
          } else {
            console.log("Logo removida com sucesso");
          }
        });
      }
    }

    // 3️⃣ Excluir do banco
    db.run("DELETE FROM clinics WHERE id = ?", [clinicId], function (err) {

      if (err) return res.status(500).json({ error: err.message });

      res.json({ deleted: true });
    });

  });
});

// EXCLUIR CIDADE
app.delete('/api/cities/:id', authMiddleware, (req, res) => {

  const id = req.params.id;

  db.run("DELETE FROM cities WHERE id = ?", [id], function (err) {

    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Cidade não encontrada" });
    }

    res.json({ success: true });
  });

});

/* =====================================================
   START SERVER
===================================================== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});


