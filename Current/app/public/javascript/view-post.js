let postId;
let tempCommentId = "";

function formatDate(date) {
    let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let d = new Date(date);
    let month = months[d.getMonth()];
    let day = d.getDate();
    let year = d.getFullYear();
    
    return `${month} ${day}, ${year}`;
}

// Update user info
async function updateUserInfo() {
    try {
        let response = await fetch('/user_info');
        let data = await response.json();
        if (data.signedIn) {
            const avatar = document.getElementById('avatar');
            const avatarPreview = document.getElementById('avatar-preview');
            const username = document.getElementById('username');

            if (avatar) {
                avatar.src = data.userInfo.profilePicture || '/images/Placeholder_Profile_Image.jpg';
            }
            if (avatarPreview) {
                avatarPreview.src = data.userInfo.profilePicture || '/images/Placeholder_Profile_Image.jpg';
            }
            if (username) {
                username.textContent = data.userInfo.username || 'Guest';
            }
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
    }
}

updateUserInfo();

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
      postId: postId
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

document.addEventListener('DOMContentLoaded', () => {
    let urlParams = new URLSearchParams(window.location.search);
    postId = urlParams.get('postId');
    let post = document.getElementById('post');
  
    if (postId) {
        let url = `post_info?postId=${postId}`;
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
            document.getElementById("subject").innerText = info.subject;
            document.getElementById("uploadDate").innerText = formatDate(info.dateposted);
            document.getElementById("textContent").innerText = info.textcontent;

            document.getElementById("uploadDate").style.fontStyle = "italic";
            document.getElementById("uploadDate").style.fontSize = "10px";

            if (info.postimage){
                let image = document.getElementById("optional-image");
                image.display = "block";
                image.style.width = "400px";
                image.style.height = "400px";
                image.src = `/images/post_images/${info.postimage}`;
            }


            document.getElementById("comment-section").style.display = "flex";
            post.style.display = "flex";
            
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
        }).catch(error => {
            document.getElementById("main").innerHTML = `<p>${error.msg}</p>`;
        });
    } else {
        document.getElementById("main").innerHTML = "<p> No Post Specified </p>";
    }
  });