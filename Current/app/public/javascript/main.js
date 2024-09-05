document.addEventListener("DOMContentLoaded", () => {
    let thumbnails = [];

    function displayThumbnails(filteredThumbnails) {
        let thumbnailsContainer = document.getElementById("thumbnails-container");
        thumbnailsContainer.innerHTML = "";
        filteredThumbnails.forEach(thumbnail => {
            let thumbnailDiv = document.createElement("div");
            thumbnailDiv.className = "thumbnail-item";

            let img = document.createElement("img");
            img.src = thumbnail.src;
            img.className = "thumbnail";
            img.addEventListener("click", () => {
                window.location.href = thumbnail.link;
            });

            let title = document.createElement("p");
            title.textContent = thumbnail.title;
            title.className = "thumbnail-title";

            thumbnailDiv.appendChild(img);
            thumbnailDiv.appendChild(title);
            thumbnailsContainer.appendChild(thumbnailDiv);
        });
    }

    fetch("/newest_first").then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw Error("Something Went Wrong");
        }
    }).then(data => {
        for (let i = 0; i < data.length; ++i) {
            thumbnails[i] = {
                id: data.rows[i].thumbnail,
                src: `/images/thumbnails/${data.rows[i].thumbnail}`,
                link: `/video?vid=${data.rows[i].vid}`,
                title: `${data.rows[i].title}`
            };
        }
        displayThumbnails(thumbnails);
    }).catch(err => {
        console.log(err);
    });

    // Fetch user info to update dropdown and display username
    fetch("/user_info").then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw Error("Failed to retrieve user info.");
        }
    }).then(data => {
        let dropdownMenu = document.getElementById("dropdown-menu");
        let signinLink = document.getElementById("signin-link");
        let usernameDisplay = document.getElementById("username-display");
        let avatar = document.getElementById("avatar");

        if (data.signedIn) {
            signinLink.style.display = "none"; // Hide 'Sign In' link
            usernameDisplay.textContent = data.userInfo.username; // Display username
            avatar.src = data.userInfo.profilePicture || '/images/Placeholder_Profile_Image.jpg';
            dropdownMenu.innerHTML = `
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

    fetch('/followed_channels')
        .then(response => response.json())
        .then(data => {
            let followedChannelsHeader = document.getElementById("followed-channels-header");
            let sidebar = document.getElementById("sidebar");
            let headerHTML = followedChannelsHeader.outerHTML;

            sidebar.innerHTML = "";

            sidebar.innerHTML = headerHTML;

            if (data.message) {
                followedChannelsHeader.style.display = "none";
                sidebar.textContent = data.message;
            } else {
                if (data.channels.length > 0) {
                    followedChannelsHeader.style.display = "block";
                } else {
                    followedChannelsHeader.style.display = "none";
                }
                data.channels.forEach(channel => {
                    let channelDiv = document.createElement('div');
                    channelDiv.className = 'channel-container';
                    channelDiv.style.cursor = 'pointer';

                    let img = document.createElement('img');
                    img.src = channel.profile_picture || '/images/Placeholder_Profile_Image.jpg';
                    img.alt = `${channel.username}'s profile picture`;
                    img.className = 'channel-profile-pic';
                    
                    let username = document.createElement('p');
                    username.textContent = channel.username;
                    username.className = 'channel-username';

                    channelDiv.appendChild(img);
                    channelDiv.appendChild(username);

                    channelDiv.addEventListener('click', () => {
                        window.location.href = `/${channel.username}`;
                    });
                    sidebar.appendChild(channelDiv);
                });
            }
        })
        .catch(err => {
            console.error(err);
        });
    // Search functionality
    let searchBar = document.getElementById("search-bar");
    searchBar.addEventListener("input", () => {
        let filteredThumbnails = thumbnails.filter(thumbnail => {
            return thumbnail.title.toLowerCase().includes(searchBar.value.toLowerCase());
        });
        displayThumbnails(filteredThumbnails);
    });

    let sortButton = document.querySelector('#sort .menu');
    let sortOptions = document.querySelector('#sort .sort-options');
    sortButton.addEventListener('click', function() {
        sortOptions.style.display = sortOptions.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', function(event) {
        if (!sortButton.contains(event.target) && !sortOptions.contains(event.target)) {
            sortOptions.style.display = 'none';
        }
    });

    
    let newestFirstButton = document.getElementById("newest-first");
    let mostPopularButton = document.getElementById("most-popular");
    let mostLikedButton = document.getElementById("most-liked");

    newestFirstButton.addEventListener("click", event => {
        fetch("/newest_first").then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw Error("Something Went Wrong");
            }
        }).then(data => {
            for (let i = 0; i < data.length; ++i) {
                thumbnails[i] = {
                    id: data.rows[i].thumbnail,
                    src: `/images/thumbnails/${data.rows[i].thumbnail}`,
                    link: `/video?vid=${data.rows[i].vid}`,
                    title: `${data.rows[i].title}`
                };
            }
            displayThumbnails(thumbnails);
        }).catch(err => {
            console.log(err);
        });
    })


    mostPopularButton.addEventListener("click", event => {
        fetch("/most_popular").then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw Error("Something Went Wrong");
            }
        }).then(data => {
            for (let i = 0; i < data.length; ++i) {
                thumbnails[i] = {
                    id: data.rows[i].thumbnail,
                    src: `/images/thumbnails/${data.rows[i].thumbnail}`,
                    link: `/video?vid=${data.rows[i].vid}`,
                    title: `${data.rows[i].title}`
                };
            }
            displayThumbnails(thumbnails);
        }).catch(err => {
            console.log(err);
        });
    })

    mostLikedButton.addEventListener("click", event => {
        fetch("/most_liked").then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw Error("Something Went Wrong");
            }
        }).then(data => {
            for (let i = 0; i < data.length; ++i) {
                thumbnails[i] = {
                    id: data.rows[i].thumbnail,
                    src: `/images/thumbnails/${data.rows[i].thumbnail}`,
                    link: `/video?vid=${data.rows[i].vid}`,
                    title: `${data.rows[i].title}`
                };
            }
            displayThumbnails(thumbnails);
        }).catch(err => {
            console.log(err);
        });
    });
});