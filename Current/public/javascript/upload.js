let video = document.getElementById("choose-file");

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
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        setTimeout(() => {
            window.location.href = data.redirectUrl;
        }, 1000); 
    })
    .catch(error => {
        console.error('Error:', error);
    });
});