DROP DATABASE IF EXISTS currentvideos;

CREATE DATABASE currentvideos;
\c currentvideos
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    profile_picture VARCHAR(255)
);

CREATE TABLE video_information (
    vid VARCHAR(64) PRIMARY KEY,
    thumbnail VARCHAR(64) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(512) NOT NULL,
    userId INTEGER NOT NULL,
    tags VARCHAR(9999) NOT NULL,
    uploadDate DATE NOT NULL,
    uploadTime TIMESTAMP NOT NULL
);

CREATE TABLE video_insights(
    vid VARCHAR(64) PRIMARY KEY,
    views INTEGER NOT NULL,
    likes INTEGER NOT NULL,
    dislikes INTEGER NOT NULL,
    numberOfComments INTEGER NOT NULL
);

CREATE TABLE comments(
    vid VARCHAR(64),
    postId VARCHAR(64),
    commentId SERIAL PRIMARY KEY,
    userId INTEGER NOT NULL,
    parentCommentId INTEGER, /*commentId of potential parent comment is replying to*/
    content VARCHAR(512) NOT NULL,
    timeCommented TIMESTAMP NOT NULL
);

CREATE TABLE ratings(
    vid VARCHAR(64),
    userId INTEGER NOT NULL,
    rating VARCHAR(7)
);

CREATE TABLE follows (
    follower_id INT REFERENCES users(id),
    followee_id INT REFERENCES users(id),
    PRIMARY KEY (follower_id, followee_id)
);
CREATE TABLE forum_post_information(
    postId SERIAL PRIMARY KEY,
    userId INTEGER NOT NULL,
    postImage VARCHAR(255),  
    textContent VARCHAR(1024) NULL NULL,
    title VARCHAR(100) NOT NULL,
    timePosted TIMESTAMP NOT NULL,
    datePosted DATE NOT NULL
)
