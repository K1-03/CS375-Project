document.addEventListener('DOMContentLoaded', function() {
    fetch('/user_info')
        .then(response => response.json())
        .then(data => {
            if (data.signedIn) {
                const userInfo = data.userInfo;
                document.getElementById('username-display').textContent = userInfo.username;
                document.getElementById('avatar-display').src = userInfo.profilePicture;
            }
        })
        .catch(error => console.error('Error fetching user info:', error));
});

let video = document.getElementById("choose-video");

document.getElementById('title-input').addEventListener('input', function() {
    let titleLength = this.value.length;
    document.getElementById('title-counter').innerText = `${titleLength}/80`;
});

document.getElementById('description-input').addEventListener('input', function() {
    let descriptionLength = this.value.length;
    document.getElementById('description-counter').innerText = `${descriptionLength}/500`;
});

video.addEventListener("change", () => {
    let videoPlayer = document.getElementById("video");
    
    videoPlayer.src = URL.createObjectURL(video.files[0]);
    videoPlayer.style.display = "block";
});

document.getElementById('upload-form').addEventListener('submit', function (event) {
    event.preventDefault(); 

    let title = document.getElementById('title-input').value;
    let description = document.getElementById('description-input').value;

    let formData = new FormData(this);
    formData.append('title', title);
    formData.append('description', description);

    let actionUrl = `/upload?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`;

    fetch(actionUrl, {
        method: 'POST',
        body: formData,
    })
    .then(response => {
        if (response.ok){
             return response.json();
        }
        else{
            return response.json().then(err => {
                throw new Error(err.message); 
            });
        }
    })
    .then(data => {
        alert(data.message);
        setTimeout(() => {
            window.location.href = data.redirectUrl;
        }, 1000); 
    })
    .catch(error => {
        alert(error.message);
    });
});