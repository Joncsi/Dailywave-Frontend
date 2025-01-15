async function getProfileName() {
    try {
        const res = await fetch('http://127.0.0.1:3000/api/getProfileName', {
            method: 'GET',
            credentials: 'include',
        });

        if (res.ok) {
            const data = await res.json();
            console.log('Aktuális név:', data.name);

            const userNameElement = document.getElementById('user-name');
            userNameElement.textContent = data.name;
        } else {
            console.error('Hiba a név lekérésekor');
        }
    } catch (error) {
        console.error('Hálózati hiba a név lekérésekor:', error);
    }
}

async function getProfilPic() {
    try {
        const res = await fetch('http://127.0.0.1:3000/api/getProfilePic', {
            method: 'GET',
            credentials: 'include'
        });

        if (res.ok) {
            const data = await res.json();
            console.log(data);

            if (data.profilePicUrl) {
                const editPic = document.getElementById('profilePic');
                editPic.style.backgroundImage = `url('http://127.0.0.1:3000${data.profilePicUrl}')`;
            } else {
                console.log('Profile picture is not set.');
            }
        } else {
            console.error('Failed to fetch profile picture.');
        }
    } catch (error) {
        console.error('Error fetching profile picture:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btnLogout = document.getElementsByClassName('logoutBtn')[0];

    btnLogout.addEventListener('click', logout);

    async function logout() {
        try {
            const res = await fetch('http://127.0.0.1:3000/api/logout', {
                method: 'POST',
                credentials: 'include' // Küldi a cookie-kat a szervernek
            });

            const data = await res.json();

            if (res.ok) {
                alert(data.message); // Sikeres kijelentkezési üzenet
                window.location.href = '../login.html'; // Átirányítás a bejelentkezési oldalra
            } else if (data.errors) {
                // Több hiba megjelenítése, ha van
                alert(data.errors.map(e => e.error).join('\n'));
            } else if (data.error) {
                // Egyedi hiba megjelenítése
                alert(data.error);
            } else {
                alert('Ismeretlen hiba történt');
            }
        } catch (error) {
            console.error('Hiba történt a kijelentkezés során:', error);
            alert('Nem sikerült kapcsolódni a szerverhez. Próbáld újra később.');
        }
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('http://127.0.0.1:3000/api/checkAuth', {
            method: 'GET',
            credentials: 'include', // Ellenőrzés sütivel
        });

        if (!res.ok) {
            // Ha nem bejelentkezett felhasználó, irányítsa vissza a login oldalra
            alert('Kérlek, jelentkezz be, hogy elérhesd a profiloldalt!');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Hiba történt a hitelesítés során:', error);
        alert('Nem sikerült ellenőrizni a bejelentkezési állapotot. Próbáld újra később!');
        window.location.href = 'login.html';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    getProfileName();
    getProfilPic();
});