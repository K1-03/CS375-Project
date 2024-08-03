let express = require('express');
let path = require('path');
let app = express();
let port = 3000;

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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});