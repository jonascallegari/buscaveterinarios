// admin.js

const API = '/api/clinics';
const API_CITIES = '/api/cities';

const token = localStorage.getItem("token");

// proteger páginas
if (!token) {
    window.location = "login.html";
}

// logout global
function logout() {
    localStorage.removeItem("token");
    window.location = "login.html";
}