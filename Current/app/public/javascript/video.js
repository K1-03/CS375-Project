function formatDate(date) {
    let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let d = new Date(date);
    let month = months[d.getMonth()];
    let day = d.getDate();
    let year = d.getFullYear();
    
    return `${month} ${day}, ${year}`;
}

document.addEventListener('DOMContentLoaded', () => {
    let urlParams = new URLSearchParams(window.location.search);
    let videoId = urlParams.get('vid');
    let videoPlayer = document.getElementById('video-player');

    if (videoId) {
        let url = `video_info?vid=${videoId}`;
        fetch(url).then(response => { 
            if (response.ok) {
                return response.json();
            }
            else{
                let status = response.status;
                return response.text().then(msg => {
                throw { status, msg }; 
            });
            }}).then(content => {
                let video = document.createElement('video');
                video.setAttribute("id", "videoContent");
                video.src = `stream?file=${content.file}`;
                video.controls = true;
                videoPlayer.appendChild(video);

                document.getElementById("video-title").innerText = content.title;
                document.getElementById("description-box").style.display = "block";
                document.getElementById("upload-date").innerText = formatDate(content.uploadDate);
                document.getElementById("description-text").innerText = content.description;
            }).catch(error => {
                videoPlayer.innerHTML = `<p>${error.msg}</p>`;
            });

    } else {
        videoPlayer.innerHTML = '<p>No video specified.</p>';
    }
});