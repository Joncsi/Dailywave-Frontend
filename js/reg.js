const btnReg = document.getElementsByClassName('reg')[0];

btnReg.addEventListener('click', register);

async function register() {
    const email = document.getElementById('email').value;
    const name = document.getElementById('name').value;
    const password = document.getElementById('password').value;

    //console.log(email, name, psw, psw2);

    const res = await fetch('http://127.0.0.1:3000/api/register', {
        method: "POST",
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify({ email, name, password })
    });

    const data = await res.json();
    console.log(data);

    if (res.ok) {
        resetInputs();
        alert(data.message);
        window.location.href = '../registration.html';
    } else if (data.errors) {
        let errorMessage = '';
        for (let i = 0; i < data.errors.length; i++) {
            errorMessage += `${data.errors[i].error}\n`
        }
        alert(errorMessage);
    } else if (data.error) {
        alert(data.error);
    } else {
        alert('Ismeretlen hiba');
    }
}

function resetInputs() {
    document.getElementById('email').value = null;
    document.getElementById('name').value = null;
    document.getElementById('password').value = null;
}