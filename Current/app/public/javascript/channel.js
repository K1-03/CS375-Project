document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/user-info')
        .then(response => response.json())
        .then(userInfo => {
            const userNameElement = document.getElementById('user-name');
            const userUsernameElement = document.getElementById('user-username');

            if (userInfo.firstName && userInfo.lastName) {
                userNameElement.textContent = `${userInfo.firstName} ${userInfo.lastName}`;
            }
            if (userInfo.username) {
                userUsernameElement.textContent = `@${userInfo.username}`;
            }
        })
        .catch(error => {
            console.error('Error fetching user information:', error);
        });
});