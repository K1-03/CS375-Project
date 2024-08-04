let express = require('express');
let path = require('path');
const fs = require('fs');
const multer = require('multer');
let app = express();
let port = 3000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'videos'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1804);
    cb(null, file.fieldname + '_' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

if (!fs.existsSync('videos')) {
  fs.mkdir('videos', { recursive: true }, (err) => {
    if (err) {
      console.error('Error creating "videos" directory:', err);
    } 
  });
} 


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

app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'upload.html'));
});

app.post("/upload", upload.single('v'), (req, res) =>{
  res.send('Video Uploaded.');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});