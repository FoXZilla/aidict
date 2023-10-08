下面是 WordStore 的实现代码：

```ts
import {Readable} from 'stream';
import {WordDb} from './word-db';
import {PromptGenerator} from './prompt-generator';

class WordStore {
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

interface WordInfo {
    id: string;
    status: WordStatus;
    promptVersion: string;
    createTime: Date;
}

interface WordFullInfo extends WordInfo {
    wordDoc?: string;
    readableStream?: Readable;
}

enum WordStatus {
    PROCESSING = 'processing',
    COMPLETED = 'completed'
}
```

这个类的构造函数接收两个参数：一个 WordDb 实例和一个 PromptGenerator 实例。WordDb 实例用于与数据库进行交互，PromptGenerator 实例用于生成单词的详细信息。

getByWord 方法接收一个原始词作为参数，调用 WordDb 的 getByOriginalWord 方法获取单词信息，然后返回一个包含单词信息的 Promise。

getById 方法接收一个单词 ID 作为参数，调用 WordDb 的 getWordById 方法获取单词信息。如果单词的状态是 PROCESSING，还会调用 WordDb 的 getProcessingWord 方法获取单词生成过程中的可读流。然后返回一个包含单词全量信息的 Promise。

createWord 方法接收一个包含原始词和可读流的对象作为参数，首先获取当前的 prompt 版本号，然后检查数据库中是否已经存在相同的原始词。如果存在，会删除已存在的单词。然后创建一个新的单词记录，并将状态设置为 PROCESSING。同时，将传入的可读流存储到内存中。当可读流结束时，会生成单词的详细信息，并更新到数据库中。如果在生成过程中出现错误，会删除生成失败的单词。最后，返回一个包含新创建的单词 ID 的 Promise。