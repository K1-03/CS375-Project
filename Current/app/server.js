let express = require('express');
let path = require('path');
let bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');
const env = require('dotenv').config();
let host;
let databaseConfig;

if (process.env.NODE_ENV == "production"){
  host = "0.0.0.0";
  databaseConfig = { connectionString: process.env.DATABASE_URL };
}
else{
  host = "localhost";
  let { PGUSER, PGPASSWORD, PGDATABASE, PGHOST, PGPORT } = process.env;
	databaseConfig = { PGUSER, PGPASSWORD, PGDATABASE, PGHOST, PGPORT };
}

let pool = new Pool(databaseConfig);

pool.connect().then(() => {
  console.log("Connected to database");
});

let app = express();
let port = 8080;
const fs = require('fs');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      if (file.fieldname === 'video') {
        cb(null, path.join(__dirname,'public', 'videos'));
      } else if (file.fieldname === 'thumbnail') {
          cb(null, path.join(__dirname, 'public', 'images', 'thumbnails'));
      }
  },
  filename: (req, file, cb) => {
    if (file.fieldname == 'thumbnail'){
      cb(null, "t-" + Date.now() + '_' + Math.round(Math.random() * 99999) + path.extname(file.originalname));
    }
    else{
      cb(null, Date.now() + '_' + Math.round(Math.random() * 99999) + path.extname(file.originalname));
    }
  }
});

const upload= multer({ storage: storage });

app.use(bodyParser.json());
app.use(cookieParser());
// static files
app.use(express.static(path.join(__dirname, 'public')));

// HTML files
app.get('/', (req, res) => {
  const userInfo = req.cookies.userInfo;
  res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

app.get('/video', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'video.html'));
});

app.get('/stream', (req, res) => {
  res.sendFile(path.join(__dirname,'public', 'videos', req.query.file));
});

app.get('/video_info', async (req, res) =>{
  try{
    let result = await pool.query("SELECT * FROM video_information WHERE vid=$1", [req.query.vid]);

    if (result.rows.length === 1){
       let videoFileName = fs.readdirSync(path.join(__dirname,'public', 'videos')).find((element) => {
        return element.includes(req.query.vid);
       });

       res.status(200);
       res.json({
        title: result.rows[0].title,
        description: result.rows[0].description,
        thumbnail: result.rows[0].thumbnail,
        account: result.rows[0].userid,
        tags:   result.rows[0].tags,
        file: videoFileName,
        uploadDate: result.rows[0].uploaddate
    });
    }
    else{
      res.status(404);
      res.send(" Video Not Found :( ");
    }
  }
  catch(error){
    res.status(500);
    res.send(error);
  }
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
]), async (req, res) =>{
  let videoFile = req.files.video ? req.files.video[0] : null;
  let thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

  if (videoFile && thumbnailFile) {
    let videoId = videoFile.filename.split(".")[0];
    let thumbnailId = thumbnailFile.filename.split(".")[0];

    let title = req.query.title;
    let description = req.query.description;
    let uploadDate = new Date();


    let tags = [...description.matchAll(/#([^\s#]+)/g)];
    let tagStr = "";

    if (tags.length > 0){
       tagStr = tags[0][1];

      for (let i = 1; i < tags.length; ++i){
        tagStr += "#" + tags[i][1];
      }
    }
    
    try{
      let result = await pool.query("SELECT * FROM video_information WHERE vid=$1", [videoId]);

      while(result.rows.length != 0){
        newFilename = Date.now() + '_' + Math.round(Math.random() * 99999) + path.extname(videoFile.originalname);
        fs.rename(videoFile.path, path.join(__dirname, "videos", newFilename), err => console.log(err));
        videoId = newFilename.split(".")[0];
        result = await pool.query("SELECT * FROM video_information WHERE vid=$1", [videoId]);
      }

      pool.query("INSERT INTO video_information (vid, thumbnail, title, description, userId, tags, uploadDate)"
        + "VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [videoId, thumbnailId, title, description, 1804, tagStr, uploadDate]);

      res.json({ message: 'Video uploaded successfully.', redirectUrl: '/account' });
    }
    catch(err){
      res.status(500);
      res.json({message: "Server error."});
    }
 }
 else{
    let errorMsg = "";
    res.status(400);
    
    if (!thumbnailFile){
      errorMsg += "Missing Thumbnail File\n";
    }
    
    if (!videoFile){
      errorMsg += "Missing Video File";
    }

    if (videoFile){ try { fs.unlinkSync(videoFile.path); } catch (err) { 
      console.error(`Failed to delete video file: ${err.message}`);
    } }
    if (thumbnailFile){ try { fs.unlinkSync(thumbnailFile.path); } catch (err) { 
      console.error(`Failed to delete thumbnail file: ${err.message}`);
    }  }

    res.json({ message: errorMsg});
 }
});

app.get('/signin', (req, res) => {
  res.sendFile(path.join(__dirname,'public', 'html', 'signin.html'));
});

app.get ('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'signup.html'));
});

app.post('/signin', (req, res) => {
  const { emailOrUsername, password } = req.body;

  pool.connect((err, client, release) => {
    if (err) return res.status(500).json({ message: 'Server error' });

    const isEmail = emailOrUsername.includes('@');
    const query = isEmail ?
      'SELECT * FROM users WHERE email = $1' :
      'SELECT * FROM users WHERE username = $1';

      const value = isEmail ? emailOrUsername.toLowerCase : emailOrUsername;
    
    client.query(query, [value], (err, result) => {
      release();
      if (err) return res.status(500).json({ message: 'Server error' });
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        bcrypt.compare(password, user.password, (err, isValid) => {
          if (err) return res.status(500).json({ message: 'Server error' });
          if (isValid) {
            res.cookie('userInfo', {
              email: user.email,
              firstName: user.first_name,
              lastName: user.last_name,
              username: user.username,
              id: user.id
            }, { httpOnly: true });
            res.json({ message: 'Sign in successful.', redirect: '/' });
          } else {
            res.json({ message: 'Invalid email/username or password.' });
          }
        });
      } else {
        res.json({ message: 'Invalid email/username or password.' });
      }
    });
  });
});

app.post('/signup', (req, res) => {
  const { email, password, firstName, lastName, username } = req.body;

  const usrenameRegex = /^[a-zA-Z0-9]+$/;

  const lowerCaseEmail = email.toLowerCase();

  if (!usrenameRegex.test(username)) {
    return res.status(400).json({ message: 'Username can only contain letters and numbers.' });
  }

  pool.connect((err, client, release) => {
    if (err) return res.status(500).json({ message: 'Server error' });

    client.query('SELECT * FROM users WHERE email = $1 OR username = $2', [lowerCaseEmail, username], (err, result) => {
      if (err) {
        release();
        return res.status(500).json({ message: 'Server error' });
      }

      if (result.rows.length > 0) {
        release();
        return res.status(409).json({ message: 'Account with that email or username already exists.' });
      }
      
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          release();
          return res.status(500).json({ message: 'Server error' });
        }
        client.query(
          'INSERT INTO users (email, password, first_name, last_name, username) VALUES ($1, $2, $3, $4, $5) RETURNING *', 
          [lowerCaseEmail, hashedPassword, firstName, lastName, username],
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