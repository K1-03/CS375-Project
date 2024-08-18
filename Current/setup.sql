DROP DATABASE IF EXISTS currentvideos;

CREATE DATABASE currentvideos;
\c currentvideos
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL
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