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

function previewImage(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function() {
        const preview = document.getElementById('profilePic');
        preview.src = reader.result;
    };

    if (file) {
        reader.readAsDataURL(file); // Fájl beolvasása
    }
}

document.addEventListener('DOMContentLoaded', () => {
    getProfileName();
});
