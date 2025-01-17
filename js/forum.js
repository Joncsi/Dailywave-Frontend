// Bejelentkezési ellenőrzés minden oldalon
async function checkLoginStatus() {
    try {
        // Ellenőrizni, hogy a felhasználó be van-e jelentkezve
        const res = await fetch('http://127.0.0.1:3000/api/auth/checkAuth', {
            method: 'GET',
            credentials: 'include', // Az authentikációs süti elküldése
        });

        // Ha a válasz nem OK, irányítsuk át a bejelentkezési oldalra
        if (!res.ok) {
            alert('Kérlek, jelentkezz be!');
            window.location.href = 'login.html'; // Átirányítás a login oldalra
        }
    } catch (error) {
        console.error('Hiba történt a hitelesítés ellenőrzésekor:', error);
        alert('Nem sikerült ellenőrizni a bejelentkezési állapotot.');
        window.location.href = 'login.html'; // Ha hiba történt, irányítás a login oldalra
    }
}

// Hívjuk meg ezt a funkciót minden oldalon, ahol szükséges a bejelentkezés ellenőrzése
document.addEventListener('DOMContentLoaded', checkLoginStatus);
