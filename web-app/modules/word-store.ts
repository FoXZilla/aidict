import {Readable} from 'stream';
import {WordDb} from './word-db';
import {PromptGenerator} from './prompt-generator';

export class WordStore {
    private wordDb: WordDb;
    private promptGenerator: PromptGenerator;

    constructor(wordDb: WordDb, promptGenerator: PromptGenerator) {
        this.wordDb = wordDb;
        this.promptGenerator = promptGenerator;
    }

    async getByWord(originalWord: string): Promise<WordInfo> {
        const word = await this.wordDb.getByOriginalWord(originalWord);
        return {
            id: word.id,
            status: word.status,
            promptVersion: word.promptVersion,
            createTime: word.createTime
        };
    }

    async getById(wordId: string): Promise<WordFullInfo> {
        const word = await this.wordDb.getWordById(wordId);
        let readableStream;
        if (word.status === WordStatus.PROCESSING) {
            readableStream = this.wordDb.getProcessingWord(wordId);
        }
        return {
            id: word.id,
            status: word.status,
            promptVersion: word.promptVersion,
            createTime: word.createTime,
            wordDoc: word.wordDoc,
            readableStream: readableStream
        };
    }

    async createWord(params: { originalWord: string; readableStream: Readable }): Promise<string> {
        const promptVersion = this.promptGenerator.getPromptVersion();
        let word;
        try {
            word = await this.wordDb.getByOriginalWord(params.originalWord);
        } catch (error) {
            // Word does not exist, continue with creation
        }
        if (word) {
            await this.wordDb.deleteWord(word.id);
            await this.wordDb.deleteProcessingWord(word.id);
        }
        const wordId = await this.wordDb.createWord(params.originalWord, WordStatus.PROCESSING, promptVersion, new Date().toISOString(), null);
        await this.wordDb.createProcessingWord(wordId, params.readableStream);
        params.readableStream.on('end', async () => {
            const wordDoc = await this.promptGenerator.generateWordDoc(params.originalWord);
            await this.wordDb.updateWord(wordId, params.originalWord, WordStatus.COMPLETED, promptVersion, new Date().toISOString(), wordDoc);
        });
        params.readableStream.on('error', async (error) => {
            console.error(`Error generating word: ${error}`);
            await this.wordDb.deleteWord(wordId);
            await this.wordDb.deleteProcessingWord(wordId);
        });
        return wordId;
    }
}

export interface WordInfo {
    id: string;
    status: WordStatus;
    promptVersion: string;
    createTime: Date;
}

export interface WordFullInfo extends WordInfo {
    wordDoc?: string;
    readableStream?: Readable;
}

export enum WordStatus {
    PROCESSING = 'processing',
    COMPLETED = 'completed'
}