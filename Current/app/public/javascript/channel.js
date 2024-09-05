let userId = null;

function formatDate(date) {
    let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let d = new Date(date);
    let month = months[d.getMonth()];
    let day = d.getDate();
    let year = d.getFullYear();
    
    return `${month} ${day}, ${year}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const homeTabLink = document.querySelector('.channel-tabs ul li:first-child');
    showTab('home-tab', homeTabLink);

    const username = window.location.pathname.split('/')[1];


    fetch(`/api/username/${username}`)
        .then(response => response.json())
        .then(data => {
            const userNameElement = document.getElementById('user-name');
            const userUsernameElement = document.getElementById('user-username');
            const profilePictureElement = document.getElementById('profile-picture');
            const followButton = document.getElementById('follow-button');
            const uploadButtonWrapper = document.getElementById('upload-button-wrapper');
            const postButtonWrapper = document.getElementById('post-button-wrapper');
            // Display user information
            if (data.user) {
                const user = data.user;
                userId = user.id;
                if (user.first_name && user.last_name) {
                    userNameElement.textContent = `${user.first_name} ${user.last_name}`;
                }
                if (user.username) {
                    userUsernameElement.textContent = `@${user.username} • ${user.followerCount} followers • ${user.video_count} videos`;
                }
                if (user.profile_picture) {
                    profilePictureElement.src = user.profile_picture;
                }

                if (data.isOwner) {
                    uploadButtonWrapper.style.display = 'block';
                    postButtonWrapper.style.display = 'block';
                    followButton.style.display = 'none';
                } else {
                    uploadButtonWrapper.style.display = 'none';
                    postButtonWrapper.style.display = 'none';
                    followButton.style.display = 'block';
                    followButton.textContent = data.following ? 'Unfollow' : 'Follow';
                    followButton.addEventListener('click', () => {
                        handleFollowButton(userId, followButton);
                    });
                }
                
                loadUserVideos(userId, '/most_viewed');
            } else {
                console.error('User data missing.');
            }
        })
        .catch(error => {
            console.error('Error fetching user information:', error);
        });

    const dropdownMenu = document.getElementById('dropdown-menu');
    const signinLink = document.getElementById('signin-link');
    const usernameDisplay = document.getElementById('username-display');
    const avatar = document.getElementById('avatar');

    fetch('/user_info').then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw Error("Failed to retrieve user info.");
        }
    }).then(data => {
        if (data.signedIn) {
            signinLink.style.display = 'none'; // Hide 'Sign In' link
            usernameDisplay.textContent = data.userInfo.username; // Display username
            avatar.src = data.userInfo.profilePicture || '/images/Placeholder_Profile_Image.jpg';
            dropdownMenu.innerHTML = `
                <a href="/${data.userInfo.username}">Channel</a>
                <a href="/account">Account</a>
                <a href="/upload">Upload</a>
                <a id="logout-link" href="#">Logout</a>
            `;

            // Add logout functionality
            document.getElementById("logout-link").addEventListener("click", (event) => {
                event.preventDefault();
                fetch('/logout', {
                    method: 'POST'
                }).then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw Error("Failed to log out.");
                    }
                }).then(data => {
                    alert(data.message);
                    window.location.href = data.redirect; // Redirect to homepage
                }).catch(err => {
                    console.error(err);
                });
            });
        } else {
            usernameDisplay.textContent = '';
            avatar.src = '/images/Placeholder_Profile_Image.jpg';  
            signinLink.style.display = 'block';        
        }
    }).catch(err => {
        console.error(err);
    });
});

function handleFollowButton(followedUserId, button) {
    fetch('/follow', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ followedUserId })
    })
    .then(response => response.json())
    .then(data => {
        button.textContent = button.textContent === 'Follow' ? 'Unfollow' : 'Follow';
    })
    .catch(error => {
        console.error('Error handling follow/unfollow:', error);
    });
}

function showTab(tabId, tabLink) {
    const tabs = document.querySelectorAll('.tab-content');
    const tabLinks = document.querySelectorAll('.channel-tabs ul li');
    tabs.forEach(tab => {
        tab.style.display = 'none';
    });

    tabLinks.forEach(link => {
        link.classList.remove('active-tab');
    });

    const selectedTab = document.getElementById(tabId);

    if (selectedTab) {
        selectedTab.style.display = 'block';
    } else {
        console.error(`Tab with ID ${tabId} not found.`);
    }

    if (tabLink) {
        tabLink.classList.add('active-tab');
    }
}

function loadUserVideos(userId, endpoint) {
    const videosContainer = document.getElementById(endpoint === '/user_videos' ? 'videos-videos-container' : 'home-videos-container');
    if (!videosContainer) {
        console.error(`Element with ID "${endpoint === 'user_videos' ? 'videos-videos-container' : 'home-videos-container'}" not found.`);
        return;
    }

    fetch(`${endpoint}?userid=${userId}`)
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text); });
            }
            return response.json();
        })
        .then(data => {            
            while (videosContainer.firstChild) {
                videosContainer.removeChild(videosContainer.firstChild);
            }

            data.rows.forEach(video => {
                const videoItem = document.createElement('div');
                videoItem.className = 'video-item';

                const videoTitle = document.createElement('h3');
                videoTitle.textContent = video.title;

                const videoThumbnail = document.createElement('img');
                videoThumbnail.src = `/images/thumbnails/${video.thumbnail}`;
                videoThumbnail.alt = video.title;
                videoThumbnail.className = "clickable-thumbnail";
                videoThumbnail.addEventListener("click", () => {
                    window.location.href = `/video?vid=${video.vid}`;
                });
                
                videoItem.appendChild(videoThumbnail);
                videoItem.appendChild(videoTitle);

                videosContainer.appendChild(videoItem);

            });
        })
        .catch(error => {
            console.error('Error loading videos:', error);
        });
}

function loadUserPosts() {
    if (!(document.getElementById("posts-container").className === "loaded")) {
        fetch(`/user_posts?userid=${userId}`).then(async res => {
            let posts = (await res.json()).posts;
            posts.forEach(post => {
                let postBox = document.createElement("div");
                postBox.setAttribute("id", `post-${post.postid}`);
                postBox.classList.add('post-box');

                postBox.addEventListener("click", () => {
                    window.location.href = `/view-post?postId=${post.postid}`;
                });

                let postTitle = document.createElement("h3");
                let postContent = document.createElement("p");
                let postDate = document.createElement("p");

                postTitle.textContent = post.title;
                postContent.textContent = post.textcontent;
                postDate.textContent = formatDate(post.dateposted);

                postDate.style.fontStyle = "italic";
                postDate.style.fontSize = "10px";

                postTitle.classList.add('post-title');
                postContent.classList.add('post-content');

                postBox.appendChild(postTitle);
                if (post.postimage){
                    let postImage = document.createElement("img");
                    postImage.style.width = "200px";
                    postImage.style.height = "200px";
                    postImage.src = `/images/post_images/${post.postimage}`;
                    postBox.appendChild(postImage);
                }
                postBox.appendChild(postContent);
                postBox.appendChild(postDate);
                document.getElementById("posts-container").appendChild(postBox);
            });
        });
        document.getElementById("posts-container").className = "loaded";
    }
}