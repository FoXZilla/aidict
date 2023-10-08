CREATE DATABASE IF NOT EXISTS ai_dictionary;
USE ai_dictionary;

CREATE TABLE IF NOT EXISTS words (
  id VARCHAR(36) PRIMARY KEY,
  original_word VARCHAR(255) NOT NULL,
  status VARCHAR(255) NOT NULL,
  prompt_version VARCHAR(255) NOT NULL,
  create_time DATETIME NOT NULL,
  word_doc TEXT NOT NULL
);