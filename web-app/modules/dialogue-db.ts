import {v4 as uuidv4} from 'uuid';
import * as mysql from 'mysql2/promise';

export interface Message {
    sender: string;
    content: string;
}

export class DialogueDb {
    private connection: mysql.Connection;

    constructor(connection: mysql.Connection) {
        this.connection = connection;
    }

    async createDialog(messages: Message[]): Promise<string> {
        const id = uuidv4();
        const [rows] = await this.connection.execute(
            `INSERT INTO dialogues (id, dependent_dialog_id_list, messages) VALUES (?, ?, ?)`,
            [id, JSON.stringify([]), JSON.stringify(messages)]
        );
        if ((rows as mysql.OkPacket).affectedRows > 0) {
            return id;
        } else {
            throw new Error('Failed to create dialogue');
        }
    }

    async getDialog(dialogId: string): Promise<Message[]> {
        const [rows] = await this.connection.execute(
            `SELECT * FROM dialogues WHERE id = ?`,
            [dialogId]
        );
        if ((rows as mysql.RowDataPacket[]).length > 0) {
            const dialog = rows[0];
            const dependentDialogIds = JSON.parse(dialog.dependent_dialog_id_list);
            let messages = [];
            for (const dependentDialogId of dependentDialogIds) {
                const dependentDialog = await this.getDialog(dependentDialogId);
                messages = messages.concat(dependentDialog);
            }
            messages = messages.concat(JSON.parse(dialog.messages));
            return messages;
        } else {
            throw new Error(`Dialogue with id ${dialogId} not found`);
        }
    }

    async forkDialog(dialogId: string, messages: Message[]): Promise<string> {
        const id = uuidv4();
        const [rows] = await this.connection.execute(
            `INSERT INTO dialogues (id, dependent_dialog_id_list, messages) VALUES (?, ?, ?)`,
            [id, JSON.stringify([dialogId]), JSON.stringify(messages)]
        );
        if ((rows as mysql.OkPacket).affectedRows > 0) {
            return id;
        } else {
            throw new Error('Failed to fork dialogue');
        }
    }
}