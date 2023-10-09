import { DialogStore } from './dialogue-store';
import { DialogueDb, Message } from './dialogue-db';

describe('DialogStore', () => {
    let dialogueDbMock: Partial<jest.Mocked<DialogueDb>>;
    let dialogStore: DialogStore;

    beforeEach(() => {
        dialogueDbMock = {
            createDialog: jest.fn(),
            getDialog: jest.fn(),
            forkDialog: jest.fn(),
        };
        dialogStore = new DialogStore(dialogueDbMock as jest.Mocked<DialogueDb>);
    });

    test('createDialog', async () => {
        const messages: Message[] = [
            { sender: 'user', content: 'Hello' },
            { sender: 'bot', content: 'Hi' },
        ];
        const dialogId = '123';
        dialogueDbMock.createDialog.mockResolvedValue(dialogId);

        const result = await dialogStore.createDialog(messages);

        expect(result).toBe(dialogId);
        expect(dialogueDbMock.createDialog).toHaveBeenCalledWith(messages);
    });

    test('getDialog', async () => {
        const dialogId = '123';
        const messages: Message[] = [
            { sender: 'user', content: 'Hello' },
            { sender: 'bot', content: 'Hi' },
        ];
        dialogueDbMock.getDialog.mockResolvedValue(messages);

        const result = await dialogStore.getDialog(dialogId);

        expect(result).toEqual(messages);
        expect(dialogueDbMock.getDialog).toHaveBeenCalledWith(dialogId);
    });

    test('appendMessage', async () => {
        const dialogId = '123';
        const newMessages: Message[] = [
            { sender: 'user', content: 'How are you?' },
            { sender: 'bot', content: 'I am fine, thank you.' },
        ];
        const newDialogId = '456';
        dialogueDbMock.forkDialog.mockResolvedValue(newDialogId);

        const result = await dialogStore.appendMessage({ dialogId, newMessages });

        expect(result).toBe(newDialogId);
        expect(dialogueDbMock.forkDialog).toHaveBeenCalledWith(dialogId, newMessages);
    });
});