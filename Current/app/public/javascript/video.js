let videoId;
let tempCommentId = "temp";

function formatDate(date) {
    let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let d = new Date(date);
    let month = months[d.getMonth()];
    let day = d.getDate();
    let year = d.getFullYear();
    
    return `${month} ${day}, ${year}`;
}

const commentInput = document.getElementById('comment-input');
const commentButton = document.getElementById('comment-button');
const cancelButton = document.getElementById('cancel-button');

commentInput.addEventListener('input', () => {
    if (commentInput.value.trim() !== "") {
        commentButton.disabled = false;
        commentButton.classList.add('active');
    } else {
        commentButton.disabled = true;
        commentButton.classList.remove('active');
    }
});

cancelButton.addEventListener('click', () => {
    commentInput.value = '';
    commentButton.disabled = true;
    commentButton.classList.remove('active');
});

commentButton.addEventListener('click', async () =>{
  fetch('/comment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      comment: commentInput.value,
      vid: videoId
    })
  }).then(async res => {
    alert(await res.text());
  });

  let response = await fetch('/user_info');
  let data = await response.json();
  
  tempCommentId += "*";

  let commentElement = document.createElement('div');
  commentElement.setAttribute("id", `comment-${tempCommentId}`);
  commentElement.setAttribute("class", "comment-element");
  let profileImage = document.createElement('img');
  if (data.userInfo.profilePicture) {
      profileImage.setAttribute("src", `${data.userInfo.profilePicture}`);
  }
  else{
      profileImage.setAttribute("src", `/images/Placeholder_Profile_Image.jpg`);
  }
  profileImage.setAttribute("alt", `${data.userInfo.username}'s profile picture`);
  profileImage.setAttribute("class", "comment-avatar");

  let userName = document.createElement("a");
  let commentBody = document.createElement("p");
  let channelLink = document.createElement("a");
  
  userName.textContent = `@${data.userInfo.username}`;
  commentBody.textContent = commentInput.value;

  userName.setAttribute("class", "username-channel-link");
  userName.setAttribute("href", `/${data.userInfo.username}`);
  channelLink.setAttribute("href", `/${data.userInfo.username}`);

  channelLink.appendChild(profileImage);
  commentElement.appendChild(channelLink);
  commentElement.appendChild(userName);
  commentElement.appendChild(commentBody);

  document.getElementById("comments").appendChild(commentElement);

  commentInput.value = "";
  commentButton.disabled = true;
  commentButton.classList.remove('active');
});

async function updateLikeDislikeButtons() {
  try {
      let response = await fetch(`/rate?vid=${videoId}`, {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json'
          }
      });
      let data = await response.json();
      let likeButton = document.getElementById("like");
      let dislikeButton = document.getElementById("dislike");

      if (data.rating === 'like') {
          likeButton.textContent = 'Liked';
          dislikeButton.textContent = 'Dislike';
      } else if (data.rating === 'dislike') {
          likeButton.textContent = 'Like';
          dislikeButton.textContent = 'Disliked';
      } else {
          likeButton.textContent = 'Like';
          dislikeButton.textContent = 'Dislike';
      }
  } catch (error) {
      console.error('Error fetching rating:', error);
  }
}

document.getElementById("like").addEventListener("click", async (event) => {
  let likeButton = event.target;
  let newRating = likeButton.textContent === 'Unlike' ? 'none' : 'like';

  try {
      await fetch('/rate', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              rating: newRating,
              vid: videoId
          })
      });

      updateLikeDislikeButtons();

  } catch (error) {
      console.error('Error updating rating:', error);
  }
});

document.getElementById("dislike").addEventListener("click", async (event) => {
  let dislikeButton = event.target;
  let newRating = dislikeButton.textContent === 'Undislike' ? 'none' : 'dislike';

  try {
      await fetch('/rate', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              rating: newRating,
              vid: videoId
          })
      });

      
      updateLikeDislikeButtons();
      
  } catch (error) {
      console.error('Error updating rating:', error);
  }
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
      }).then(info => {
          let video = document.createElement('video');
          video.setAttribute("id", "videoContent");
          video.src = `stream?file=${info.file}`;
          video.controls = true;
          videoPlayer.appendChild(video);

          document.getElementById("video-title").innerText = info.title;
          document.getElementById("description-box").style.display = "block";
          document.getElementById("insights").style.display = "block";
          document.getElementById("comment-section").style.display = "flex";
          document.getElementById("upload-date").innerText = formatDate(info.uploadDate);
          document.getElementById("description-text").innerText = info.description;
          
          info.comments.forEach(comment => {
            fetch(`account_info?userId=${comment.userid}`)
                .then(res => res.json())
                .then(userInfo => {
                    let commentElement = document.createElement('div');
                    commentElement.setAttribute("id", `comment-${comment.commentid}`);
                    commentElement.setAttribute("class", "comment-element");
                    let profileImage = document.createElement('img');
                    if (userInfo.profile_picture) {
                      profileImage.setAttribute("src", `${userInfo.profile_picture}`);
                    }
                    else{
                        profileImage.setAttribute("src", `/images/Placeholder_Profile_Image.jpg`);
                    }
                    profileImage.setAttribute("alt", `${userInfo.username}'s profile picture`);
                    profileImage.setAttribute("class", "comment-avatar");

                    let userName = document.createElement("a");
                    let commentBody = document.createElement("p");
                    let channelLink = document.createElement("a");
  
                    userName.textContent = `@${userInfo.username}`;
                    commentBody.textContent = `${comment.content}`;

                    userName.setAttribute("class", "username-channel-link");
                    userName.setAttribute("href", `/${userInfo.username}`);
                    channelLink.setAttribute("href", `/${userInfo.username}`);

                    channelLink.appendChild(profileImage);
                    commentElement.appendChild(channelLink);
                    commentElement.appendChild(userName);
                    commentElement.appendChild(commentBody);

                    document.getElementById("comments").appendChild(commentElement);

                  }
                 )
                .catch(error => {
                    console.error('Error fetching user info:', error);
                });
        });

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
      
      updateLikeDislikeButtons();

  } else {
      videoPlayer.innerHTML = '<p>No video specified.</p>';
  }
});