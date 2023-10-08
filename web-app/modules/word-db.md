以下是完整的 `WordDb` 类的实现，包括了所有的方法和必要的注释：

```typescript
import { v4 as uuidv4 } from 'uuid';
import mysql from 'mysql2/promise';
import { Readable } from 'stream';

/**
 * WordDb 类用于处理与单词相关的数据库操作。
 * 
 * @class WordDb
 */
class WordDb {
  private connection: mysql.Connection;
  private processingWordMap: Map<string, Readable>;

  /**
   * 创建一个新的 WordDb 实例。
   * 
   * @param {mysql.Connection} connection - MySQL 连接对象。
   */
  constructor(connection: mysql.Connection) {
    this.connection = connection;
    this.processingWordMap = new Map();
  }

  /**
   * 将一个正在生成的词存储到内存中。
   * 
   * @param {string} wordId - 单词ID。
   * @param {Readable} readableStream - 可读流。
   * @returns {Promise<void>}
   */
  async createProcessingWord(wordId: string, readableStream: Readable): Promise<void> {
    this.processingWordMap.set(wordId, readableStream);
    readableStream.on('end', () => {
      this.processingWordMap.delete(wordId);
    });
  }

  /**
   * 从内存中移除正在生成状态中的词。
   * 
   * @param {string} wordId - 单词ID。
   * @returns {Promise<void>}
   */
  async deleteProcessingWord(wordId: string): Promise<void> {
    this.processingWordMap.delete(wordId);
  }

  /**
   * 在初始化时删除所有正在生成状态中的词。
   * 
   * @returns {Promise<void>}
   */
  async deleteProcessingWordsOnInitialization(): Promise<void> {
    // 清理内存中的数据
    this.processingWordMap.clear();

    // 清理MySQL中的数据
    await this.connection.execute(
      `DELETE FROM words WHERE status = 'processing'`
    );
  }

  async createWord(originalWord: string, status: string, promptVersion: string, createTime: string, wordDoc: string): Promise<string> {
    const id = uuidv4();

    const [rows] = await this.connection.execute(
      `INSERT INTO words (id, original_word, status, prompt_version, create_time, word_doc) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, originalWord, status, promptVersion, createTime, wordDoc]
    );

    if (rows.affectedRows > 0) {
      return id;
    } else {
      throw new Error('Failed to create word');
    }
  }

  async getWordById(wordId: string): Promise<any> {
    const [rows] = await this.connection.execute(
      `SELECT * FROM words WHERE id = ?`,
      [wordId]
    );

    if (rows.length > 0) {
      const word = rows[0];
      return {
        id: word.id,
        originalWord: word.original_word,
        status: word.status,
        promptVersion: word.prompt_version,
        createTime: word.create_time,
        wordDoc: word.word_doc
      };
    } else {
      throw new Error(`Word with id ${wordId} not found`);
    }
  }

  async deleteWord(wordId: string): Promise<void> {
    const [rows] = await this.connection.execute(
      `DELETE FROM words WHERE id = ?`,
      [wordId]
    );

    if (rows.affectedRows === 0) {
      throw new Error(`Word with id ${wordId} not found`);
    }
  }

  async updateWord(id: string, originalWord: string, status: string, promptVersion: string, createTime: string, wordDoc: string): Promise<void> {

    const [rows] = await this.connection.execute(
      `UPDATE words SET original_word = ?, status = ?, prompt_version = ?, create_time = ?, word_doc = ? WHERE id = ?`,
      [originalWord, status, promptVersion, createTime, wordDoc, id]
    );

    if (rows.affectedRows === 0) {
      throw new Error(`Word with id ${id} not found`);
    }
  }

  async getByOriginalWord(originalWord: string): Promise<any> {
    const [rows] = await this.connection.execute(
      `SELECT * FROM words WHERE original_word = ?`,
      [originalWord]
    );

    if (rows.length > 0) {
      const word = rows[0];
      return {
        id: word.id,
        originalWord: word.original_word,
        status: word.status,
        promptVersion: word.prompt_version,
        createTime: word.create_time,
        wordDoc: word.word_doc
      };
    } else {
      throw new Error(`Word with original word ${originalWord} not found`);
    }
  }
}

// 使用示例
(async () => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'database',
  });

  const wordDb = new WordDb(connection);

  // 创建一个可读流
  const readableStream = new Readable();
  readableStream.push('Hello, world!');
  readableStream.push(null);

  // 将可读流存储到内存中
  await wordDb.createProcessingWord('1', readableStream);

  // 从内存中删除可读流
  await wordDb.deleteProcessingWord('1');

  // 在初始化时删除所有正在生成状态中的词
  await wordDb.deleteProcessingWordsOnInitialization();

  const wordId = await wordDb.createWord('example', 'active', '1.0', new Date().toISOString(), 'Example word document');

  console.log(`Created word with id ${wordId}`);

  const word = await wordDb.getWordById(wordId);
  console.log(`Retrieved word: ${JSON.stringify(word)}`);

  await wordDb.updateWord(wordId, 'example', 'inactive', '1.0', new Date().toISOString(), 'Example word document');
  console.log(`Updated word with id ${wordId}`);

  const wordByOriginal = await wordDb.getByOriginalWord('example');
  console.log(`Retrieved word by original: ${JSON.stringify(wordByOriginal)}`);

  await wordDb.deleteWord(wordId);
  console.log(`Deleted word with id ${wordId}`);
})();
```

这个代码假设你已经有一个名为 `words` 的表，并且这个表有 `id`、`original_word`、`status`、`prompt_version`、`create_time` 和 `word_doc` 这几个字段。你需要根据实际的数据库配置修改 `mysql.createConnection` 的参数。

注意，这个代码是一个 Node.js 脚本，你可以将它保存为一个 `.js` 文件，然后使用 Node.js 来运行。