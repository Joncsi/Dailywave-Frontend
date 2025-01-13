const btnLogin = document.getElementsByClassName('login')[0];

btnLogin.addEventListener('click', login);

async function login() {
    const email = document.getElementById('email').value;
    const psw = document.getElementById('psw').value;

    try {
        const res = await fetch('http://127.0.0.1:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, psw }),
            credentials: 'include',
        });

        // Ellenőrizzük, hogy a válasz sikeres volt
        if (!res.ok) {
            throw new Error(`Hiba történt: ${res.status}`);
        }

        // Próbálkozunk JSON választ kapni
        let data;
        try {
            data = await res.json();  // JSON válasz
        } catch (error) {
            console.error('Nem JSON válasz:', error);
            alert('A válasz nem megfelelő formátumban van.');
            return;
        }

        // Ellenőrizzük, hogy van-e üzenet a válaszban
        if (data.message) {
            alert(data.message);
            window.location.href = '../home.html';
        } else {
            alert('Ismeretlen válasz a szervertől');
        }
    } catch (error) {
        console.error('Hiba történt:', error);
        alert('A válasz nem megfelelő formátumban van, vagy a backend nem válaszolt megfelelően.');
    }
}
