let express = require('express');
let path = require('path');
let bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const pg = require('pg');
const env = require("./env.json");
const Pool = pg.Pool;
const pool = new Pool(env);

pool.connect().then(() => {
  console.log("Connected to database");
});

let app = express();
let port = 3000;
const fs = require('fs');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      if (file.fieldname === 'video') {
          cb(null, 'videos');
      } else if (file.fieldname === 'thumbnail') {
          cb(null, 'thumbnails');
      }
  },
  filename: (req, file, cb) => {
    if (file.fieldname == 'thumbnail'){
      cb(null, "t-" + Date.now() + '_' + Math.round(Math.random() * 1804) + path.extname(file.originalname));
    }
    else{
      cb(null, Date.now() + '_' + Math.round(Math.random() * 1804) + path.extname(file.originalname));
    }
  }
});



const upload= multer({ storage: storage });

if (!fs.existsSync('videos')) {
  fs.mkdir('videos', { recursive: true }, (err) => {
    if (err) {
      console.error('Error creating "videos" directory:', err);
    } 
  });
} 

if (!fs.existsSync('thumbnails')) {
  fs.mkdir('thumbnails', { recursive: true }, (err) => {
    if (err) {
      console.error('Error creating "thumbnails" directory:', err);
    } 
  });
} 

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

app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'upload.html'));
});

app.post("/upload",  upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), (req, res) =>{
  let videoFile = req.files.video ? req.files.video[0] : null;
  let thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

  if (videoFile && thumbnailFile) {
    let videoId = videoFile.filename.split(".")[0];
    let thumbnailId = thumbnailFile.filename.split(".")[0];

    let title = req.query.title;
    let description = req.query.description;
    let tags = [...description.matchAll(/#([^\s#]+)/g)];
    
    let tagStr = tags[0][1];

    for (let i = 1; i < tags.length; ++i){
      tagStr += "#" + tags[i][1];
    }

    pool.query("INSERT INTO video_information (vid, thumbnail, title, description, tags) VALUES ($1, $2, $3, $4, $5)",
      [videoId, thumbnailId, title, description, tagStr]);

    res.json({ message: 'Video uploaded successfully.', redirectUrl: '/account' });
 }
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