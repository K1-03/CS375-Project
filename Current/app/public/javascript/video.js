let videoId;

function formatDate(date) {
    let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let d = new Date(date);
    let month = months[d.getMonth()];
    let day = d.getDate();
    let year = d.getFullYear();
    
    return `${month} ${day}, ${year}`;
}

document.getElementById("like").addEventListener("click", (event) => {
    fetch('/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating: "like",
          vid: videoId
        })
      });
});

document.getElementById("dislike").addEventListener("click", (event) => {
    fetch('/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating: "dislike",
          vid: videoId
        })
      });
});

document.addEventListener('DOMContentLoaded', () => {
  let urlParams = new URLSearchParams(window.location.search);
  videoId = urlParams.get('vid');
  let videoPlayer = document.getElementById('video-player');

  if (videoId) {
      let url = `video_info?vid=${videoId}`;
      fetch(url).then(response => { 
          if (response.ok) {
              return response.json();
          } else {
              let status = response.status;
              return response.text().then(msg => {
                  throw { status, msg };
              });
          }
      }).then(content => {
          let video = document.createElement('video');
          video.setAttribute("id", "videoContent");
          video.src = `stream?file=${content.file}`;
          video.controls = true;
          videoPlayer.appendChild(video);

          document.getElementById("video-title").innerText = content.title;
          document.getElementById("description-box").style.display = "block";
          document.getElementById("insights").style.display = "block";
          document.getElementById("upload-date").innerText = formatDate(content.uploadDate);
          document.getElementById("description-text").innerText = content.description;

          fetch(`video_insights?vid=${videoId}`).then(response => response.json()).then(insights => {
              document.getElementById("views-count").innerText = insights.views;
              document.getElementById("likes-count").innerText = insights.likes;
              document.getElementById("dislikes-count").innerText = insights.dislikes;
          }).catch(error => {
              console.error('Error fetching video insights:', error);
          });
      }).catch(error => {
          videoPlayer.innerHTML = `<p>${error.msg}</p>`;
      });
  } else {
      videoPlayer.innerHTML = '<p>No video specified.</p>';
  }
});