import * as mysql from 'mysql2/promise';

export interface Dialog {
    id: string;
    title: string;
}

export interface Word {
    id: string;
    originalWord: string;
}

export class FeedDb {
    private connection: mysql.Connection;
    private maxRecords: number;

    constructor(connection: mysql.Connection, maxRecords: number = 100) {
        this.connection = connection;
        this.maxRecords = maxRecords;
    }

    async getNewestChat(top: number): Promise<Dialog[]> {
        const [rows] = await this.connection.execute(
            `SELECT * FROM newest_dialogues ORDER BY created_at DESC LIMIT ?`,
            [top]
        );
        return (rows as mysql.RowDataPacket[]).map(row => ({
            id: row.id,
            title: row.title
        }));
    }

    async getNewestWord(top: number): Promise<Word[]> {
        const [rows] = await this.connection.execute(
            `SELECT * FROM newest_words ORDER BY created_at DESC LIMIT ?`,
            [top]
        );
        return (rows as mysql.RowDataPacket[]).map(row => ({
            id: row.id,
            originalWord: row.original_word
        }));
    }

    async writeNewestChat(dialogId: string, dialogTitle: string): Promise<void> {
        await this.connection.execute(
            `INSERT INTO newest_dialogues (id, title) VALUES (?, ?)`,
            [dialogId, dialogTitle]
        );
        const [rows] = await this.connection.execute(
            `SELECT COUNT(*) as count FROM newest_dialogues`
        );
        const count = (rows as mysql.RowDataPacket[])[0].count;
        if (count > this.maxRecords) {
            await this.connection.execute(
                `DELETE FROM newest_dialogues ORDER BY created_at ASC LIMIT ?`,
                [count - this.maxRecords]
            );
        }
    }

    async writeNewestWord(wordId: string, originalWord: string): Promise<void> {
        await this.connection.execute(
            `INSERT INTO newest_words (id, original_word) VALUES (?, ?)`,
            [wordId, originalWord]
        );
        const [rows] = await this.connection.execute(
            `SELECT COUNT(*) as count FROM newest_words`
        );
        const count = (rows as mysql.RowDataPacket[])[0].count;
        if (count > this.maxRecords) {
            await this.connection.execute(
                `DELETE FROM newest_words ORDER BY created_at ASC LIMIT ?`,
                [count - this.maxRecords]
            );
        }
    }
}