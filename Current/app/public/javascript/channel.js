let userId = null;
document.addEventListener('DOMContentLoaded', () => {
    const homeTabLink = document.querySelector('.channel-tabs ul li:first-child');
    
    showTab('home-tab', homeTabLink);

    fetch('/user_info')
        .then(response => response.json())
        .then(data => {
            const userNameElement = document.getElementById('user-name');
            const userUsernameElement = document.getElementById('user-username');
            const profilePictureElement = document.getElementById('profile-picture');

            if (data.signedIn) {  
                const userInfo = data.userInfo;
                if (userInfo.firstName && userInfo.lastName) {
                    userNameElement.textContent = `${userInfo.firstName} ${userInfo.lastName}`;
                }
                if (userInfo.username) {
                    userUsernameElement.textContent = `@${userInfo.username}`;
                }
                if (userInfo.profilePicture) {
                    profilePictureElement.src = userInfo.profilePicture;
                }
                loadUserVideos(userInfo.id, '/most_viewed');
            } else {
                console.error('User not signed in or user info missing.');
            }
        })
        .catch(error => {
            console.error('Error fetching user information:', error);
        });
});

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
