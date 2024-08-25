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
    uploadDate DATE NOT NULL
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
    commentId SERIAL PRIMARY KEY,
    userId INTEGER NOT NULL,
    parentCommentId INTEGER, /*commentId of potential parent comment is replying to*/
    content VARCHAR(512) NOT NULL,
    timeCommented DATE NOT NULL
);

CREATE TABLE ratings(
    vid VARCHAR(64),
    userId INTEGER NOT NULL,
    rating VARCHAR(7)
);