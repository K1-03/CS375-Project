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
    let actionUrl = `/upload?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`;

    this.action = actionUrl;
    this.submit();
});