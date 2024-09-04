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
      cb(null, path.join(__dirname, 'public', 'videos'));
    } else if (file.fieldname === 'thumbnail') {
      cb(null, path.join(__dirname, 'public', 'images', 'thumbnails'));
    } else if (file.fieldname === 'profilepicture') {
      cb(null, path.join(__dirname, 'public', 'images', 'profilepictures'));
    } 
    else if (file.fieldname === 'postImage') {
      cb(null, path.join(__dirname, 'public', 'images', 'post_images'));
    }
    else {
      cb(new Error('Invalid field name'), false);
    }
  },
  filename: (req, file, cb) => {
    if (file.fieldname === 'thumbnail') {
      cb(null, "t-" + Date.now() + '_' + Math.round(Math.random() * 99999) + path.extname(file.originalname));
    } else if (file.fieldname === 'profilepicture') {
      cb(null, "profile-" + Date.now() + path.extname(file.originalname));
    } else {
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
  res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

app.get('/user_info', (req, res) => {
  const userInfo = req.cookies.userInfo;
  const usernameQuery = req.query.username;
  console.log('User Info from Cookies:', userInfo);
  console.log('Query Username:', usernameQuery);

  if (userInfo) {
    const isOwner = req.query.username && req.query.username.toLowerCase() === userInfo.username.toLowerCase();
    console.log('Is Owner:', isOwner);
    res.json({ 
      signedIn: true, 
      userInfo: userInfo,
      showUploadButton: isOwner
    });
  } else {
    res.json({ signedIn: false });
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('userInfo');
  res.json({ message: 'Logged out successfully.', redirect: '/' });
});

app.post('/update_account', upload.fields([
  { name: 'profilepicture', maxCount: 1 }
]), async (req, res) => {
  const { username, password, firstName, lastName, email } = req.body;
  const userInfo = req.cookies.userInfo;

  try {
    let client = await pool.connect();

    let query = 'SELECT * FROM users WHERE (LOWER(username) = LOWER($1) OR email = $2) AND id != $3';
    let result = await client.query(query, [username.toLowerCase(), email.toLowerCase(), userInfo.id]);

    if (result.rows.length > 0) {
      return res.status(409).json({ message: 'Username or email already exists.' });
    }

    let updateQuery = 'UPDATE users SET username = $1, first_name = $2, last_name = $3, email = $4';
    let params = [username, firstName, lastName, email];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', password = $5';
      params.push(hashedPassword);
    }

    if (req.files && req.files.profilepicture) {
      const profilePicturePath = `/images/profilepictures/${req.files.profilepicture[0].filename}`;
      updateQuery += ', profile_picture = $6';
      params.push(profilePicturePath);
    }

    updateQuery += ' WHERE id = $' + (params.length + 1);
    params.push(userInfo.id);

    await client.query(updateQuery, params);

    
    res.cookie('userInfo', {
      ...userInfo,
      username: username,
      email: email,
      firstName: firstName,
      lastName: lastName,
      profilePicture: req.files && req.files.profilepicture ? `/images/profilepictures/${req.files.profilepicture[0].filename}` : userInfo.profilePicture
    }, { httpOnly: true });

    res.redirect('/account');

  } catch (err) {
    console.error('Error updating account:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/video', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'video.html'));
});

app.get('/view-post', (req, res) =>{
  res.sendFile(path.join(__dirname, 'public', 'html', 'view-post.html'));
})

app.get('/stream', (req, res) => {
  let id = req.query.file.split(".")[0];
  pool.query("UPDATE video_insights SET views = views + 1 WHERE vid=($1)", [id]);
  
  res.sendFile(path.join(__dirname,'public', 'videos', req.query.file));
});

app.post('/rate', async (req, res) => {
  if (req.cookies.userInfo){
  try {
      let content = req.body;
      let userId = req.cookies.userInfo.id;
      let vid = content.vid;

      // Check if the user has already rated the video
      let result = await pool.query(
          'SELECT * FROM ratings WHERE vid=$1 AND userId=$2',
          [vid, userId]
      );

      if (result.rowCount === 0) {
          await pool.query('INSERT INTO ratings (vid, userId, rating) VALUES ($1, $2, $3)', [vid, userId, content.rating]);
          if (content.rating === 'like') {
              await pool.query('UPDATE video_insights SET likes = likes + 1 WHERE vid=$1', [vid]);
          } else if (content.rating === 'dislike') {
              await pool.query('UPDATE video_insights SET dislikes = dislikes + 1 WHERE vid=$1', [vid] );
          }
      } else if (result.rowCount === 1 && result.rows[0].rating === content.rating){
          await pool.query('DELETE FROM ratings WHERE vid=$1 AND userId=$2', [vid, userId] );
          if (content.rating === 'like') {
              await pool.query('UPDATE video_insights SET likes = likes - 1 WHERE vid=$1', [vid] );
          } else if (content.rating === 'dislike') {
              await pool.query('UPDATE video_insights SET dislikes = dislikes - 1 WHERE vid=$1', [vid]);
          }
      }
      else{
        await pool.query('DELETE FROM ratings WHERE vid=$1 AND userId=$2', [vid, userId] );
        await pool.query('INSERT INTO ratings (vid, userId, rating) VALUES ($1, $2, $3)', [vid, userId, content.rating]);
          if (content.rating === 'like') {
              await pool.query('UPDATE video_insights SET likes = likes + 1 WHERE vid=$1', [vid] );
              await pool.query('UPDATE video_insights SET dislikes = dislikes - 1 WHERE vid=$1', [vid] );
          } else if (content.rating === 'dislike') {
              await pool.query('UPDATE video_insights SET dislikes = dislikes + 1 WHERE vid=$1', [vid]);
              await pool.query('UPDATE video_insights SET likes = likes - 1 WHERE vid=$1', [vid] );
          }
      }

      res.status(200).send('Rating updated successfully.');
  } catch (err) {
      console.error(err);
      res.status(500).send('An error occurred while updating the rating.');
  }
  }
  else{
    res.status(401).send("Must be signed in to rate.")
  }
});

app.post('/comment', (req, res) => {
  if (req.cookies.userInfo){
    if (req.body.parentId){
      //Code for replies to existing comments.
    }
    else{
      if (req.body.vid){
        pool.query("INSERT INTO comments (vid, userId, timeCommented, content) VALUES ($1, $2, $3, $4)",
          [req.body.vid, req.cookies.userInfo.id, (new Date()).toISOString().slice(0, 19).replace('T', ' '), req.body.comment]);
        res.send("Comment posted successfully");
      }
      else if (req.body.postId){
        pool.query("INSERT INTO comments (postId, userId, timeCommented, content) VALUES ($1, $2, $3, $4)",
          [req.body.postId, req.cookies.userInfo.id, (new Date()).toISOString().slice(0, 19).replace('T', ' '), req.body.comment]);
        res.send("Comment posted successfully");
      }
    }
  }
  else{
    res.status(401);
    res.send("Must be signed in to comment");
  }
});

app.get('/newest_first', async (req, res) => {
  try{
    let result = await pool.query("SELECT * FROM video_information ORDER BY uploadtime DESC;");

    let videoFileName = fs.readdirSync(path.join(__dirname,'public', 'videos')).find((element) => {
      return element.includes(req.query.vid);
    });

    res.status(200);
    res.json({
      rows: result.rows,
      length: result.rowCount
    });
  }
  catch(error){
    res.status(500);
    res.send(error);
  }
});

app.get('/most_popular', async (req, res) => {
  try{
    let result = await pool.query("SELECT * FROM video_information vi JOIN video_insights vs ON vi.vid = vs.vid ORDER BY vs.views DESC;");

    let videoFileName = fs.readdirSync(path.join(__dirname,'public', 'videos')).find((element) => {
      return element.includes(req.query.vid);
    });

    res.status(200);
    res.json({
      rows: result.rows,
      length: result.rowCount
    });
  }
  catch(error){
    res.status(500);
    res.send(error);
  }
});

app.get('/most_liked', async (req, res) => {
  try{
    let result = await pool.query("SELECT * FROM video_information vi JOIN video_insights vs ON vi.vid = vs.vid ORDER BY vs.likes DESC;");

    let videoFileName = fs.readdirSync(path.join(__dirname,'public', 'videos')).find((element) => {
      return element.includes(req.query.vid);
    });

    res.status(200);
    res.json({
      rows: result.rows,
      length: result.rowCount
    });
  }
  catch(error){
    res.status(500);
    res.send(error);
  }
});

app.get('/video_info', async (req, res) =>{
  try{
    let result = await pool.query("SELECT * FROM video_information WHERE vid=$1", [req.query.vid]);
    let commentResult = await pool.query("SELECT * FROM comments WHERE vid=$1 ORDER BY commentid DESC", [req.query.vid]);

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
        uploadDate: result.rows[0].uploaddate,
        uploadTime: result.rows[0].uploadtime,
        comments: commentResult.rows
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

app.get('/post_info', async (req, res) =>{
  try{
    let result = await pool.query("SELECT * FROM forum_post_information WHERE postid=$1", [req.query.postId]);
    let commentResult = await pool.query("SELECT * FROM comments WHERE postid=$1 ORDER BY commentid DESC", [req.query.postId]);

    if (result.rows.length === 1){
       res.status(200);
       res.json({
        subject: result.rows[0].title,
        textcontent: result.rows[0].textcontent,
        account: result.rows[0].userid,
        timeposted: result.rows[0].timeposted,
        dateposted: result.rows[0].dateposted,
        comments: commentResult.rows,
        postimage: result.rows[0].postimage
    });
    }
    else{
      res.status(404);
      res.send(" Post Not Found :( ");
    }
  }
  catch(error){
    res.status(500);
    res.send(error);
  }
});

app.get('/account_info', async (req, res) => {
  let result = await pool.query("SELECT username, profile_picture FROM users WHERE id = $1", [req.query.userId]);

  res.json({
    username: result.rows[0].username,
    profile_picture: result.rows[0].profile_picture
 });
});

app.get('/video_insights', async (req, res) => {
  const videoId = req.query.vid;

  if (!videoId) {
      return res.status(400).send('Video ID is required');
  }

  try {
      const insights = await pool.query('SELECT views, likes, dislikes FROM video_insights WHERE vid = $1', [videoId]);

      if (insights.rows.length > 0) {
          res.json(insights.rows[0]);
      } else {
          res.status(404).send('Video insights not found');
      }
  } catch (err) {
      console.error('Error retrieving video insights:', err);
      res.status(500).send('Internal server error');
  }
});

app.get('/account', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'account.html'));
});

app.get('/upload', (req, res) => {
  if (req.cookies.userInfo){
    res.sendFile(path.join(__dirname, 'public', 'html', 'upload.html'));
  }
  else{
    res.sendFile(path.join(__dirname, 'public', 'html', 'signin.html'));
  }
});

app.get('/post', (req, res) => {
  if (req.cookies.userInfo){
    res.sendFile(path.join(__dirname, 'public', 'html', 'post.html'));
  }
  else{
    res.sendFile(path.join(__dirname, 'public', 'html', 'signin.html'));
  }
});

app.get('/signin', (req, res) => {
  res.sendFile(path.join(__dirname,'public', 'html', 'signin.html'));
});

app.get ('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'signup.html'));
});

app.get('/user_posts', async (req, res) => {
  try{
    if(req.query.userid){
      let result = await pool.query("SELECT * FROM forum_post_information WHERE userid= $1", [req.query.userid]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'No posts found' });
      }
      res.json({posts : result.rows});
    }
    else{
      return res.status(401).json({ error: 'No user specified' });
    }
  }
  catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/user_videos', async (req, res) => {
  try {
    const userId = req.query.userid;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    const query = 'SELECT * FROM video_information WHERE userid = $1 ORDER BY uploaddate DESC';
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No videos found' });
    }
    res.json({ rows: result.rows });
    } catch (err) {
      console.error('Error executing query', err.stack);
      res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/most_viewed', async (req, res) => {
  try {
    const userId = req.query.userid;
    const query = `SELECT vi.*, vs.views FROM video_information vi JOIN video_insights vs ON vi.vid = vs.vid WHERE vi.userid = $1 ORDER BY vs.views DESC`;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No videos found' });
    }
    res.json(result);
  } catch (err) {
    console.error('Error executing query', err.stack);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// MAKE SURE THIS IS THE LAST GET REQUEST AS
// IT WILL INTERFERE WITH OTHER GET REQUESTS OTHERWISE
app.get('/api/username/:username', async (req, res) => {
  const username = req.params.username.toLowerCase();
  const userInfo = req.cookies.userInfo;
  console.log('Request Username:', username);
  console.log('User Info from Cookies:', userInfo);

  //console.log(userInfo);

  try {
    const result = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
    console.log('Database Query Result:', result.rows);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const isOwner = userInfo && userInfo.username.toLowerCase() === username;
      console.log('Is Owner:', isOwner);

      res.json({
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          profile_picture: user.profile_picture || '/images/Placeholder_Profile_Image.jpg'
        },
        isOwner: isOwner
      });
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    console.error('Error checking username:', err);
    res.status(500).send('Server error');
  }
});

app.get('/:username', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'channel.html'));
});

app.post("/post",  upload.fields([
  { name: 'postImage', maxCount: 1 }
]),async(req, res) =>{
  let postImageFile = req.files.postImage ? req.files.postImage[0] : null;
  let imageFilename;

  let userId = req.cookies.userInfo.id;

  let subject = req.query.subject;
  let comment = req.query.comment;

  let datePosted = new Date();
  let timePosted = datePosted.toISOString().slice(0, 19).replace('T', ' ');

  if (postImageFile){
    imageFilename = postImageFile.filename;
  }

  try{
    pool.query("INSERT INTO forum_post_information (userId, textContent, title, timePosted, datePosted, postImage)"
        + "VALUES ($1, $2, $3, $4, $5, $6)",
        [userId, comment, subject, timePosted, datePosted, imageFilename]);
        res.json({message: "Post Created Successfully", redirectUrl: '/view-post' })
  }
  catch(err){
    res.status(500);
    res.json({message: "Server Error"});
  }
});

app.post("/upload",  upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) =>{
  let videoFile = req.files.video ? req.files.video[0] : null;
  let thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

  if (videoFile && thumbnailFile) {
    let videoId = videoFile.filename.split(".")[0];
    let thumbnailId = thumbnailFile.filename;
    let userId = req.cookies.userInfo.id;

    let title = req.query.title;
    let description = req.query.description;
    let uploadDate = new Date();
    let uploadTime = uploadDate.toISOString().slice(0, 19).replace('T', ' ');


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

      pool.query("INSERT INTO video_information (vid, thumbnail, title, description, userId, tags, uploadDate, uploadTime)"
        + "VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [videoId, thumbnailId, title, description, userId, tagStr, uploadDate, uploadTime]);

      pool.query("INSERT INTO video_insights (vid, views, likes, dislikes, numberOfComments)"
        + "VALUES ($1, $2, $3, $4, $5)",
        [videoId, 0, 0, 0, 0]);

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


app.post('/signin', (req, res) => {
  const { emailOrUsername, password } = req.body;

  pool.connect((err, client, release) => {
    if (err) return res.status(500).json({ message: 'Server error' });

    const isEmail = emailOrUsername.includes('@');
    const query = isEmail ?
      'SELECT * FROM users WHERE email = $1' :
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1)';

    const value = emailOrUsername.toLowerCase();

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
              id: user.id,
              profilePicture: user.profile_picture || '/images/Placeholder_Profile_Image.jpg'
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
  const lowerCaseUsername = username.toLowerCase();

  if (!usrenameRegex.test(username)) {
    return res.status(400).json({ message: 'Username can only contain letters and numbers.' });
  }

  pool.connect((err, client, release) => {
    if (err) return res.status(500).json({ message: 'Server error' });

    client.query('SELECT * FROM users WHERE email = $1 OR LOWER(username) = $2', [lowerCaseEmail, lowerCaseUsername], (err, result) => {
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