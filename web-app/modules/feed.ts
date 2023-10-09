import { FeedDb, Dialog, Word } from './feed-db';

export class Feed {
    private feedDb: FeedDb;

    constructor(feedDb: FeedDb) {
        this.feedDb = feedDb;
    }

    /**
     * 获取推荐的对话
     * @param wordId 单词ID
     * @returns Promise<{newest: Dialog[]}> 返回一个Promise，resolve的结果是一个包含最新对话的对象
     */
    async getChatFeed(wordId: string): Promise<{newest: Dialog[]}> {
        const dialogs = await this.feedDb.getNewestChat(20);
        return { newest: dialogs };
    }

    /**
     * 获取推荐的单词
     * @returns Promise<{newest: Word[]}> 返回一个Promise，resolve的结果是一个包含最新单词的对象
     */
    async getWordFeed(): Promise<{newest: Word[]}> {
        const words = await this.feedDb.getNewestWord(20);
        return { newest: words };
    }

    /**
     * 推送新的对话
     * @param dialogId 对话ID
     * @param dialogTitle 对话标题
     * @param wordId 单词ID
     * @returns Promise<void>
     */
    async pushNewChat(dialogId: string, dialogTitle: string, wordId: string): Promise<void> {
        await this.feedDb.writeNewestChat(dialogId, dialogTitle);
    }

    /**
     * 推送新的单词
     * @param wordId 单词ID
     * @param originalWord 原始单词
     * @returns Promise<void>
     */
    async pushNewWord(wordId: string, originalWord: string): Promise<void> {
        await this.feedDb.writeNewestWord(wordId, originalWord);
    }
}