import { Feed } from './feed';
import { FeedDb, Dialog, Word } from './feed-db';

describe('Feed', () => {
    let feedDb: FeedDb;
    let feed: Feed;

    beforeEach(() => {
        // 创建 FeedDb 的 mock
        feedDb = {
            getNewestChat: jest.fn(),
            getNewestWord: jest.fn(),
            writeNewestChat: jest.fn(),
            writeNewestWord: jest.fn(),
        } as any;
        feed = new Feed(feedDb);
    });

    test('getChatFeed', async () => {
        const dialogs: Dialog[] = [{ id: '1', title: 'dialog1' }];
        (feedDb.getNewestChat as jest.Mock).mockResolvedValue(dialogs);

        const result = await feed.getChatFeed('1');
        expect(result).toEqual({ newest: dialogs });
        expect(feedDb.getNewestChat).toHaveBeenCalledWith(20);
    });

    test('getWordFeed', async () => {
        const words: Word[] = [{ id: '1', originalWord: 'word1' }];
        (feedDb.getNewestWord as jest.Mock).mockResolvedValue(words);

        const result = await feed.getWordFeed();
        expect(result).toEqual({ newest: words });
        expect(feedDb.getNewestWord).toHaveBeenCalledWith(20);
    });

    test('pushNewChat', async () => {
        await feed.pushNewChat('1', 'dialog1', '1');
        expect(feedDb.writeNewestChat).toHaveBeenCalledWith('1', 'dialog1');
    });

    test('pushNewWord', async () => {
        await feed.pushNewWord('1', 'word1');
        expect(feedDb.writeNewestWord).toHaveBeenCalledWith('1', 'word1');
    });
});