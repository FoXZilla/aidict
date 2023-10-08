import { Readable } from 'stream';
import * as mysql from 'mysql2/promise';
import {WordDb} from './word-db';

describe('WordDb', () => {
    let connection;
    let wordDb;

    beforeAll(async () => {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            port: 8081,
            password: '123456',
            database: 'ai_dictionary',
        });

        wordDb = new WordDb(connection);
    });

    afterAll(async () => {
        await connection.end();
    });

    test('createProcessingWord', async () => {
        const readableStream = new Readable();
        readableStream.push('Hello, world!');
        readableStream.push(null);

        await wordDb.createProcessingWord('1', readableStream);
        expect(wordDb.processingWordMap.has('1')).toBe(true);
    });

    test('deleteProcessingWord', async () => {
        await wordDb.deleteProcessingWord('1');
        expect(wordDb.processingWordMap.has('1')).toBe(false);
    });

    test('deleteProcessingWordsOnInitialization', async () => {
        const readableStream = new Readable();
        readableStream.push('Hello, world!');
        readableStream.push(null);

        await wordDb.createProcessingWord('1', readableStream);
        await wordDb.deleteProcessingWordsOnInitialization();
        expect(wordDb.processingWordMap.has('1')).toBe(false);
    });

    test('createWord', async () => {
        const wordId = await wordDb.createWord('example', 'active', '1.0', new Date().toISOString(), 'Example word document');
        expect(wordId).toBeDefined();
    });

    test('getWordById', async () => {
        const wordId = await wordDb.createWord('example', 'active', '1.0', new Date().toISOString(), 'Example word document');
        const word = await wordDb.getWordById(wordId);
        expect(word).toBeDefined();
        expect(word.id).toBe(wordId);
    });

    test('updateWord', async () => {
        const wordId = await wordDb.createWord('example', 'active', '1.0', new Date().toISOString(), 'Example word document');
        await wordDb.updateWord(wordId, 'example', 'inactive', '1.0', new Date().toISOString(), 'Example word document');
        const word = await wordDb.getWordById(wordId);
        expect(word.status).toBe('inactive');
    });

    test('deleteWord', async () => {
        const wordId = await wordDb.createWord('example', 'active', '1.0', new Date().toISOString(), 'Example word document');
        await wordDb.deleteWord(wordId);
        await expect(wordDb.getWordById(wordId)).rejects.toThrow();
    });

    test('getByOriginalWord', async () => {
        const wordId = await wordDb.createWord('example', 'active', '1.0', new Date().toISOString(), 'Example word document');
        const word = await wordDb.getByOriginalWord('example');
        expect(word).toBeDefined();
        expect(word.id).toBe(wordId);
    });
});