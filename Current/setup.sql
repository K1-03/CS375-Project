CREATE DATABASE current;
\c current
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL
);

CREATE TABLE video_information (
    videoID VARCHAR(64) PRIMARY KEY,
    videoTitle VARCHAR(100) NOT NULL,
    videoDescription VARCHAR(512) NOT NULL,
    tags VARCHAR(9999) NOT NULL
);