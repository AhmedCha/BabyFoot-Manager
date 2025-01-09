-- Database: babyfoot_manager

-- DROP DATABASE IF EXISTS babyfoot_manager;

CREATE DATABASE babyfoot_manager;
\c babyfoot_manager;

CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
