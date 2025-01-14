function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function () {
            const preview = document.getElementById("preview");
            preview.src = reader.result;
        };
        reader.readAsDataURL(file);
    }
}

// Frontend: Profilkép mentése
async function saveProfilePic() {
    const fileInput = document.getElementById('profilePicInput');
    const file = fileInput.files[0];
    
    if (!file) {
        return alert('Kérlek válassz ki egy képet!');
    }

    const formData = new FormData();
    formData.append('profile_pic', file);

    document.getElementById('loading').style.display = 'block';

    const res = await fetch('http://127.0.0.1:3000/api/editProfilePic', {
        method: 'PUT',
        body: formData,
        credentials: 'include'
    });

    document.getElementById('loading').style.display = 'none';

    const data = await res.json();

    if (res.ok) {
        const profilePicUrl = data.profilePicUrl;
        document.getElementById('preview').src = profilePicUrl;
        alert('Profilkép sikeresen frissítve!');
        window.location.href = 'profile.html'; // Vissza a profil oldalra
    } else {
        alert(data.error || 'Hiba történt a profilkép frissítésekor');
    }
}