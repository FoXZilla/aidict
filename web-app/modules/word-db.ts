import {v4 as uuidv4} from 'uuid';
import * as mysql from 'mysql2/promise';
import {Readable} from 'stream';

export class WordDb {
    private connection: mysql.Connection;
    private processingWordMap: Map<string, Readable>;

    constructor(connection: mysql.Connection) {
        this.connection = connection;
        this.processingWordMap = new Map();
    }

    async createProcessingWord(wordId: string, readableStream: Readable): Promise<void> {
        this.processingWordMap.set(wordId, readableStream);
        readableStream.on('end', () => {
            this.processingWordMap.delete(wordId);
        });
    }

    async deleteProcessingWord(wordId: string): Promise<void> {
        this.processingWordMap.delete(wordId);
    }

    async deleteProcessingWordsOnInitialization(): Promise<void> {
        this.processingWordMap.clear();
        await this.connection.execute(
            `DELETE FROM words WHERE status = 'processing'`
        );
    }

    async createWord(originalWord: string, status: string, promptVersion: string, createTime: string, wordDoc: string): Promise<string> {
        const id = uuidv4();
        const mysqlDateTime = new Date(createTime).toISOString().slice(0, 19).replace('T', ' ');
        const [rows] = await this.connection.execute(
            `INSERT INTO words (id, original_word, status, prompt_version, create_time, word_doc) VALUES (?, ?, ?, ?, ?, ?)`,
            [id, originalWord, status, promptVersion, mysqlDateTime, wordDoc]
        );
        if ((rows as mysql.OkPacket).affectedRows > 0) {
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
        if ((rows as mysql.RowDataPacket[]).length > 0) {
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
        if ((rows as mysql.OkPacket).affectedRows === 0) {
            throw new Error(`Word with id ${wordId} not found`);
        }
    }

    async updateWord(id: string, originalWord: string, status: string, promptVersion: string, createTime: string, wordDoc: string): Promise<void> {
        const mysqlDateTime = new Date(createTime).toISOString().slice(0, 19).replace('T', ' ');
        const [rows] = await this.connection.execute(
            `UPDATE words SET original_word = ?, status = ?, prompt_version = ?, create_time = ?, word_doc = ? WHERE id = ?`,
            [originalWord, status, promptVersion, mysqlDateTime, wordDoc, id]
        );
        if ((rows as mysql.OkPacket).affectedRows === 0) {
            throw new Error(`Word with id ${id} not found`);
        }
    }

    async getByOriginalWord(originalWord: string): Promise<any> {
        const [rows] = await this.connection.execute(
            `SELECT * FROM words WHERE original_word = ?`,
            [originalWord]
        );
        if ((rows as mysql.RowDataPacket[]).length > 0) {
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
