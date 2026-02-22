const API = "/api";

const token = localStorage.getItem("token");

if (token) {
    window.location = "index.html";
}

document.getElementById("loginForm").addEventListener("submit", async e => {
    e.preventDefault();

    const res = await fetch(API + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: username.value,
            password: password.value
        })
    });

    const data = await res.json();

    if (data.token) {
        localStorage.setItem("token", data.token);
        window.location = "index.html";
    } else {
        erro.innerText = data.error;
    }
});
