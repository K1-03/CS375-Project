document.addEventListener('DOMContentLoaded', () => {
    fetch('/user_info')
        .then(response => response.json())
        .then(data => {
            const userNameElement = document.getElementById('user-name');
            const userUsernameElement = document.getElementById('user-username');

            if (data.signedIn) {  
                const userInfo = data.userInfo;
                if (userInfo.firstName && userInfo.lastName) {
                    userNameElement.textContent = `${userInfo.firstName} ${userInfo.lastName}`;
                }
                if (userInfo.username) {
                    userUsernameElement.textContent = `@${userInfo.username}`;
                }
                loadMostViewedVideos(userInfo.id);
            } else {
                console.error('User not signed in or user info missing.');
            }
        })
        .catch(error => {
            console.error('Error fetching user information:', error);
        });
});

function showTab(tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.style.display = 'none';
    });
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    } else {
        console.error(`Tab with ID ${tabId} not found.`);
    }
}

function loadMostViewedVideos(userId) {
    const videosContainer = document.getElementById('videos-container');
    if (!videosContainer) {
        console.error('Element with ID "videos-container" not found.');
        return;
    }

    fetch(`/user_videos?userid=${userId}`)
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

showTab('home-tab');