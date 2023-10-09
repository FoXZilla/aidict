import { DialogueDb, Message } from './dialogue-db';

export class DialogStore {
    private dialogueDb: DialogueDb;

    constructor(dialogueDb: DialogueDb) {
        this.dialogueDb = dialogueDb;
    }

    /**
     * 创建一个新的对话
     * @param messages Message对象的数组
     * @returns Promise<string> 返回一个Promise，resolve的结果是新创建的对话ID
     */
    async createDialog(messages: Message[]): Promise<string> {
        return this.dialogueDb.createDialog(messages);
    }

    /**
     * 获取一个对话的全量消息
     * @param dialogId 对话ID
     * @returns Promise<Message[]> 返回一个Promise，resolve的结果是Message对象的数组
     */
    async getDialog(dialogId: string): Promise<Message[]> {
        return this.dialogueDb.getDialog(dialogId);
    }

    /**
     * 基于一个已有的对话创建一个新的对话
     * @param dialogId 对话ID
     * @param messages Message对象的数组
     * @returns Promise<string> 返回一个Promise，resolve的结果是新创建的对话ID
     */
    async appendMessage({dialogId, newMessages}: {dialogId: string, newMessages: Message[]}): Promise<string> {
        return this.dialogueDb.forkDialog(dialogId, newMessages);
    }
}