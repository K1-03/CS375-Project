function signIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch('/signin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(result => {
        document.getElementById('message').textContent = result.message;
        if (result.redirect) {
            window.location.href = result.redirect;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('message').textContent = 'An unexpected error occured.';
    });
}

function signUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;

    fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, firstName, lastName })
    })
    .then(response => response.json())
    .then(result => {
        document.getElementById('message').textContent = result.message;
        if (result.message === 'Account created successfully.') {
            window.location.href = '/signin';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('message').textContent = 'An unexpected error occurred.';
    });
}