import * as mysql from 'mysql2/promise';
import {DialogueDb, Message} from './dialogue-db';

describe('DialogueDb', () => {
    let connection;
    let dialogueDb;

    beforeAll(async () => {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            port: 8081,
            password: '123456',
            database: 'ai_dictionary',
        });

        dialogueDb = new DialogueDb(connection);
    });

    afterAll(async () => {
        await connection.end();
    });

    test('createDialog', async () => {
        const messages: Message[] = [
            {sender: 'user', content: 'Hello'},
            {sender: 'bot', content: 'Hi'}
        ];
        const dialogId = await dialogueDb.createDialog(messages);
        expect(dialogId).toBeDefined();
    });

    test('getDialog', async () => {
        const messages: Message[] = [
            {sender: 'user', content: 'Hello'},
            {sender: 'bot', content: 'Hi'}
        ];
        const dialogId = await dialogueDb.createDialog(messages);
        const dialogMessages = await dialogueDb.getDialog(dialogId);
        expect(dialogMessages).toEqual(messages);
    });

    test('forkDialog', async () => {
        const messages: Message[] = [
            {sender: 'user', content: 'Hello'},
            {sender: 'bot', content: 'Hi'}
        ];
        const dialogId = await dialogueDb.createDialog(messages);
        const forkedDialogId = await dialogueDb.forkDialog(dialogId, [
            {sender: 'user', content: 'How are you?'},
            {sender: 'bot', content: 'I am fine, thank you.'}
        ]);
        const forkedDialogMessages = await dialogueDb.getDialog(forkedDialogId);
        expect(forkedDialogMessages).toEqual([
            ...messages,
            {sender: 'user', content: 'How are you?'},
            {sender: 'bot', content: 'I am fine, thank you.'}
        ]);
    });
});