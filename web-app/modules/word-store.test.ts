import {Readable} from 'stream';
import {WordDb} from './word-db';
import {PromptGenerator} from './prompt-generator';
import {WordStore, WordStatus} from './word-store';
import {v4 as uuidv4} from 'uuid';

describe('WordStore', () => {
    let wordDb: WordDb;
    let promptGenerator: PromptGenerator;
    let wordStore: WordStore;

    beforeEach(() => {
        wordDb = new WordDb();
        promptGenerator = new PromptGenerator();
        wordStore = new WordStore(wordDb, promptGenerator);
    });

    it('should get word by original word', async () => {
        const originalWord = 'example';
        const word = {
            id: uuidv4(),
            originalWord: originalWord,
            status: WordStatus.COMPLETED,
            promptVersion: '1.0',
            createTime: new Date().toISOString(),
            wordDoc: 'Example word document'
        };
        wordDb.getByOriginalWord = jest.fn().mockResolvedValue(word);
        const result = await wordStore.getByWord(originalWord);
        expect(result).toEqual(word);
    });

    it('should get word by id', async () => {
        const wordId = uuidv4();
        const word = {
            id: wordId,
            originalWord: 'example',
            status: WordStatus.COMPLETED,
            promptVersion: '1.0',
            createTime: new Date().toISOString(),
            wordDoc: 'Example word document'
        };
        wordDb.getWordById = jest.fn().mockResolvedValue(word);
        const result = await wordStore.getById(wordId);
        expect(result).toEqual(word);
    });

    it('should create word', async () => {
        const originalWord = 'example';
        const readableStream = new Readable();
        readableStream.push('Hello, world!');
        readableStream.push(null);
        const wordId = uuidv4();
        wordDb.createWord = jest.fn().mockResolvedValue(wordId);
        wordDb.createProcessingWord = jest.fn().mockResolvedValue(undefined);
        promptGenerator.getPromptVersion = jest.fn().mockReturnValue('1.0');
        promptGenerator.generateWordDoc = jest.fn().mockResolvedValue('Example word document');
        const result = await wordStore.createWord({originalWord: originalWord, readableStream: readableStream});
        expect(result).toEqual(wordId);
    });
});