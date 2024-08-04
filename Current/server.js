let express = require('express');
let path = require('path');
let bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const pool = require('./database');
let app = express();
let port = 3000;

app.use(bodyParser.json());
// static files
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
  pool.connect((err, client, release) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    
    client.query('SELECT * FROM users WHERE email = $1', [email], (err, result) => {
      release();
      if (err) return res.status(500).json({ message: 'Server error' });
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        bcrypt.compare(password, user.password, (err, isValid) => {
          if (err) return res.status(500).json({ message: 'Server error' });
          if (isValid) {
            res.json({ message: 'Sign in successful.', redirect: '/' });
          } else {
            res.json({ message: 'Invalid email or password.' });
          }
        });
      } else {
        res.json({ message: 'Invalid email or password.' });
      }
    });
  });
});

app.post('/signup', (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  pool.connect((err, client, release) => {
    if (err) return res.status(500).json({ message: 'Server error' });

    client.query('SELECT * FROM users WHERE email = $1', [email], (err, result) => {
      if (err) {
        release();
        return res.status(500).json({ message: 'Server error' });
      }

      if (result.rows.length > 0) {
        release();
        return res.status(409).json({ message: 'Account already exists.' });
      }
      
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          release();
          return res.status(500).json({ message: 'Server error' });
        }
        client.query(
          'INSERT INTO users (email, password, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING *', 
          [email, hashedPassword, firstName, lastName],
          (err, result) => {
            release();
            if (err) return res.status(500).json({ message: 'Server error' });
            
            res.status(201).json({ message: 'Account created successfully.' });
          }
        );
      });
    });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});