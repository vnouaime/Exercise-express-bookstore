-- Added ability to connect to database 
DROP DATABASE IF EXISTS books_test;

CREATE DATABASE books_test;

\c books_test;

DROP TABLE IF EXISTS books;

CREATE TABLE books (
  isbn TEXT PRIMARY KEY,
  amazon_url TEXT,
  author TEXT,
  language TEXT, 
  pages INTEGER,
  publisher TEXT,
  title TEXT, 
  year INTEGER
);
