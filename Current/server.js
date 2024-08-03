let express = require('express');
let path = require('path');
let fs = require('fs');
let bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const pool = require('./database');
let app = express();
let port = 3000;

// static files
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

app.get('/video', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'video.html'));
});

app.get('/account', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'account.html'));
});

app.get('/signin', (req, res) => {
  res.sendFile(path.join(__dirname,'public', 'html', 'signin.html'));
});

app.get ('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'signup.html'));
});

app.post('/signin', (req, res) => {
  const { email, password } = req.body;
  pool.connect()
    .then(client => {
      return client.query('SELECT * FROM users WHERE email = $1', [email])
      .then(result => {
        client.release();
        if (result.rows.length > 0) {
          const user = result.rows[0];
          bcrypt.compare(password, user.password)
            .then(isValid => {
              if (isValid) {
                res.json({ message: 'Sign in successful.' });
              } else {
                res.json({ message: 'Invalid email or password.' });
              }
            });
        } else {
          res.json({ message: 'Invalid email or password.' });
        }
      })
      .catch(err => {
        client.release();
        console.error(err);
        res.status(500).json({ message: 'Server error' });
      });
    });
});

app.post('/signup', (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  pool.connect()
    .then(client => {
      return bcrypt.hash(password, 10)
        .then(hashedPassword => {
          return client.query('INSERT INTO users (email, password, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING *', [email, hashedPassword, firstName, lastName])
            .then(result => {
              client.release();
              res.status(201).json({ message: 'Account created successfully.' });
            });
        })
        .catch(err => {
          client.release();
          console.error(err);
          res.status(500).json({ message: 'Server error' });
        });
    });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});