function signIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;


    console.log('Sign In Request:', { email, password });

    fetch('/signin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify ({ email, password })
    })
    .then(response => response.json())
    .then(result => {
        console.log('Server Response:', result);
        document.getElementById('message').textContent = result.message;
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function signUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(result => {
        document.getElementById('message').textContent = result.message;
    })
    .catch(error => {
        console.error('Error:', error);
    });
}