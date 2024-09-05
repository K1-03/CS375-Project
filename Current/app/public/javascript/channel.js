let userId = null;
document.addEventListener('DOMContentLoaded', () => {
    const homeTabLink = document.querySelector('.channel-tabs ul li:first-child');
    showTab('home-tab', homeTabLink);

    const username = window.location.pathname.split('/')[1];
    console.log('Current Username:', username);


fetch(`/api/username/${username}`)
    .then(response => response.json())
    .then(data => {
        console.log('Fetched Data:', data);
        const userNameElement = document.getElementById('user-name');
        const userUsernameElement = document.getElementById('user-username');
        const profilePictureElement = document.getElementById('profile-picture');
        const uploadButtonWrapper = document.querySelector('.upload-button-wrapper');
        const followButton = document.getElementById('follow-button');

        // Display user information
        if (data.user) {
            const user = data.user;
            userId = user.id;
            if (user.first_name && user.last_name) {
                userNameElement.textContent = `${user.first_name} ${user.last_name}`;
            }
            if (user.username) {
                userUsernameElement.textContent = `@${user.username}`;
            }
            if (user.profile_picture) {
                profilePictureElement.src = user.profile_picture;
            }

            if (data.isOwner) {
                uploadButtonWrapper.style.display = 'block';
                followButton.style.display = 'none';
            } else {
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
        console.log(data.message);
        button.textContent = button.textContent === 'Follow' ? 'Unfollow' : 'Follow';
    })
    .catch(error => {
        console.error('Error handling follow/unfollow:', error);
    });
}

function showTab(tabId, tabLink) {
    console.log('Showing tab:', tabId);
    const tabs = document.querySelectorAll('.tab-content');
    const tabLinks = document.querySelectorAll('.channel-tabs ul li');
    console.log(tabs);
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

            console.log(data);

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
