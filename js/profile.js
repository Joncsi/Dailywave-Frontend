async function getProfileName() {
    try {
        const res = await fetch('http://127.0.0.1:3000/api/profile/getProfileName', {
            method: 'GET',
            credentials: 'include',
        });

        if (res.ok) {
            const data = await res.json();
            console.log('Aktuális név:', data.name);

            // A név frissítése a profil oldalon
            const userNameElement = document.getElementById('user-name');
            userNameElement.textContent = data.name;
        } else {
            console.error('Hiba a név lekérésekor');
        }
    } catch (error) {
        console.error('Hálózati hiba a név lekérésekor:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    getProfileName();
});
