let video = document.getElementById("choose-file");

function preview(){
    let videoPlayer = document.getElementById("video");
    
    videoPlayer.src = URL.createObjectURL(video.files[0]);
    videoPlayer.style.display = "block";
}

video.addEventListener("change", preview);