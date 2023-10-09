import * as mysql from 'mysql2/promise';
import {FeedDb, Dialog, Word} from './feed-db';

describe('FeedDb', () => {
    let connection;
    let feedDb;

    beforeAll(async () => {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            port: 8081,
            password: '123456',
            database: 'ai_dictionary',
        });

        feedDb = new FeedDb(connection);
    });

    afterAll(async () => {
        await connection.end();
    });

    test('getNewestChat', async () => {
        const dialogs: Dialog[] = await feedDb.getNewestChat(10, 'wordId');
        expect(dialogs).toBeDefined();
        expect(dialogs.length).toBeLessThanOrEqual(10);
    });

    test('getNewestWord', async () => {
        const words: Word[] = await feedDb.getNewestWord(10);
        expect(words).toBeDefined();
        expect(words.length).toBeLessThanOrEqual(10);
    });

    test('writeNewestChat', async () => {
        await feedDb.writeNewestChat('dialogId', 'dialogTitle');
        const dialogs: Dialog[] = await feedDb.getNewestChat(10, 'wordId');
        expect(dialogs).toBeDefined();
        expect(dialogs.some(dialog => dialog.id === 'dialogId')).toBe(true);
    });

    test('writeNewestWord', async () => {
        await feedDb.writeNewestWord('wordId', 'originalWord');
        const words: Word[] = await feedDb.getNewestWord(10);
        expect(words).toBeDefined();
        expect(words.some(word => word.id === 'wordId')).toBe(true);
    });

    test('writeNewestChat should not exceed maxRecords', async () => {
        const maxRecords = 100;
        feedDb = new FeedDb(connection, maxRecords);
        for (let i = 0; i < maxRecords + 10; i++) {
            await feedDb.writeNewestChat(`dialogId${i}`, `dialogTitle${i}`);
        }
        const dialogs: Dialog[] = await feedDb.getNewestChat(maxRecords + 10, 'wordId');
        expect(dialogs.length).toBe(maxRecords);
    });

    test('writeNewestWord should not exceed maxRecords', async () => {
        const maxRecords = 100;
        feedDb = new FeedDb(connection, maxRecords);
        for (let i = 0; i < maxRecords + 10; i++) {
            await feedDb.writeNewestWord(`wordId${i}`, `originalWord${i}`);
        }
        const words: Word[] = await feedDb.getNewestWord(maxRecords + 10);
        expect(words.length).toBe(maxRecords);
    });
});