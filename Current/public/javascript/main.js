document.addEventListener("DOMContentLoaded", () => {
    let thumbnails = [
        { id: "thumbnail_1", src: "/images/thumbnail_1.jpg", link: "/video?video=1", title: "Video Title 1" },
        { id: "thumbnail_2", src: "/images/thumbnail_2.jpg", link: "/video?video=2", title: "Video Title 2" },
        { id: "thumbnail_3", src: "/images/thumbnail_3.jpg", link: "/video?video=3", title: "Video Title 3" },
        { id: "thumbnail_4", src: "/images/thumbnail_4.jpg", link: "/video?video=4", title: "Video Title 4" },
    ];

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

    searchBar.addEventListener("input", () => {
        let searchText = searchBar.value.toLowerCase();
        let filteredThumbnails = thumbnails.filter(thumbnail => 
            thumbnail.title.toLowerCase().includes(searchText)
        );
        displayThumbnails(filteredThumbnails);
    });

    // Initial display of all thumbnails
    displayThumbnails(thumbnails);
});