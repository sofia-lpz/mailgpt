CREATE DATABASE trottmail;
USE trottmail;

CREATE TABLE usuarios (
    id int NOT NULL AUTO_INCREMENT,
    username varchar(50) NOT NULL DEFAULT 'none',
    password varchar(255) NOT NULL,
    role enum('admin', 'user') NOT NULL DEFAULT 'user',
    PRIMARY KEY (id)
);

CREATE TABLE embeddings
(
    embeddingId INT NOT NULL AUTO_INCREMENT,
    vector JSON NOT NULL,
    source text NOT NULL,
    metadata JSON NOT NULL,
    PRIMARY KEY (embeddingId)
);