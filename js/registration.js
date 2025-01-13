const btnReg = document.getElementById('btnReg');

btnReg.addEventListener('click', register);

async function register() {
    const email = document.getElementById('email').value;
    const name = document.getElementById('name').value;
    const psw = document.getElementById('psw').value;
    const psw2 = document.getElementById('psw2').value;

    if (psw !== psw2) {
        return alert('A két jelszó nem egyezik!');
    }

    const res = await fetch('http://127.0.0.1:3000/api/register', {
        method: "POST",
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({ email, name, password: psw }),
        credentials: 'include',
    }).catch(error => {
        console.error('Fetch error:', error);
        throw error;
    });

    if (!res.ok) {
        console.error('Response status:', res.status);
        return;
    }

    const data = await res.json();
    
    if (res.ok) {
        resetInputs();
        alert(data.message);
        window.location.href = '../login.html';
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
    document.getElementById('email').value = '';
    document.getElementById('name').value = '';
    document.getElementById('psw').value = '';
    document.getElementById('psw2').value = '';
}