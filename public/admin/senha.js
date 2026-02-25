// senha.js

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("formSenha");

    if (!form) return;

    form.addEventListener("submit", async function (e) {

        e.preventDefault();

        const currentPassword =
            document.getElementById("currentPassword").value;

        const newPassword =
            document.getElementById("newPassword").value;

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

        if (res.ok) {

            alert("Senha alterada com sucesso!");

            logout();

        }
        else {

            alert("Erro ao alterar senha");

        }

    });

});