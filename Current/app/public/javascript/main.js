document.addEventListener("DOMContentLoaded", () => {
    let thumbnails = [
    ];

    fetch("/newest_first").then((response => {
        if (response.ok){
            return response.json();
        }
        else{
            throw Error("Something Went Wrong")
        }
    })).then(data => {
        /*"data" is just some json that contains the elements "rows" (rows from SQL query) and "length" (length of SQL sresult).
        It really wasn't necessary to send the response from the server as json, but I did it out of convenience. Feel free to
        have the server just send the result and then access the rows and rowCount attribute here instead.
        */
        for (let i = data.length - 1; i >= 0; --i){
            thumbnails[data.length - i] = {id: data.rows[i].thumbnail, src: `/images/thumbnails/${data.rows[i].thumbnail}`, 
                                          link: `/video?vid=${data.rows[i].vid}`, title: `${data.rows[i].title}`}
        }
        displayThumbnails(thumbnails);
    }).catch(err => {
        console.log(err);//Something should be done here.
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

    searchBar.addEventListener("input", () => {
        let searchText = searchBar.value.toLowerCase();
        let filteredThumbnails = thumbnails.filter(thumbnail => 
            thumbnail.title.toLowerCase().includes(searchText)
        );
        displayThumbnails(filteredThumbnails);
    });
});