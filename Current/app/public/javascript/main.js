document.addEventListener("DOMContentLoaded", () => {
    let thumbnails = [];

    fetch("/newest_first").then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw Error("Something Went Wrong");
        }
    }).then(data => {
        for (let i = data.length - 1; i >= 0; --i) {
            thumbnails[data.length - i] = {
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

    let thumbnailsContainer = document.getElementById("thumbnails-container");
    let searchBar = document.getElementById("search-bar");

    function displayThumbnails(filteredThumbnails) {
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

        if (data.signedIn) {
            signinLink.style.display = "none"; // Hide 'Sign In' link
            usernameDisplay.textContent = data.userInfo.username; // Display username
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
        }
    }).catch(err => {
        console.error(err);
    });

    // Search functionality
    searchBar.addEventListener("input", () => {
        let filteredThumbnails = thumbnails.filter(thumbnail => {
            return thumbnail.title.toLowerCase().includes(searchBar.value.toLowerCase());
        });
        displayThumbnails(filteredThumbnails);
    });
});