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

-- 这个表有三个字段：`id`、`dependent_dialog_id_list` 和 `messages`。`id` 字段是对话的唯一标识符，`dependent_dialog_id_list` 字段是一个 JSON 字符串，表示这个对话依赖的其他对话的 ID 列表，`messages` 字段也是一个 JSON 字符串，表示这个对话的消息列表。

CREATE TABLE dialogues (
    id VARCHAR(36) NOT NULL,
    dependent_dialog_id_list TEXT NOT NULL,
    messages TEXT NOT NULL,
    PRIMARY KEY (id)
);