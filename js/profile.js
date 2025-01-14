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
    getProfileName();
    getProfilPic();
});


document.addEventListener('DOMContentLoaded', () => {
    getProfileName();
    getProfilPic();
});
