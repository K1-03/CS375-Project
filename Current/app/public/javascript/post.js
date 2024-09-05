document.addEventListener('DOMContentLoaded', function() {
    fetch('/user_info')
        .then(response => response.json())
        .then(data => {
            if (data.signedIn) {
                const userInfo = data.userInfo;
                document.getElementById('username').textContent = userInfo.username;
                document.getElementById('avatar').src = userInfo.profilePicture || '/images/Placeholder_Profile_Image.jpg';
            }
        })
        .catch(error => console.error('Error fetching user info:', error));
});

document.getElementById('subject-input').addEventListener('input', function() {
    let subjectLength = this.value.length;
    document.getElementById('subject-counter').innerText = `${subjectLength}/80`;
});

document.getElementById('comment-input').addEventListener('input', function() {
    let commentLength = this.value.length;
    document.getElementById('comment-counter').innerText = `${commentLength}/1000`;
});

document.getElementById('content-form').addEventListener('submit', function (event) {
    event.preventDefault(); 

    let subject = document.getElementById('subject-input').value;
    let comment = document.getElementById('comment-input').value;

    let formData = new FormData(this);

    let actionUrl = `/post?subject=${encodeURIComponent(subject)}&comment=${encodeURIComponent(comment)}`;

    if (subject.trim() === ""){
        alert("Subject can not be empty");
    }
    else{
        fetch(actionUrl, {
            method: 'POST',
            body: formData,
        }).then(res => {
            if (res.ok){
                return res.json();
           }
           else{
               return res.json().then(err => {
                   throw new Error(err.message); 
               });
           }
        }).then(data => {
            alert(data.message);
            setTimeout(() => {
                window.location.href = data.redirectUrl;
            }, 1000); 
        }).catch(error => {
            alert(error.message);
        });
    }
});