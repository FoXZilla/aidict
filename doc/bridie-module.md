# WordDb 模块文档

## 模块概述

WordDb模块是一个依赖于MySQL和内存存储的模块，主要负责对单词的增删改查操作。该模块包含7个方法，其中2个方法依赖于内存数据，其余5个方法依赖于MySQL。

## 接口定义

```typescript
interface WordDb {
  /**
   * 从内存中移除正在生成状态中的词
   * @param wordId 单词ID
   * @returns Promise<void>
   */
  deleteProcessingWord(wordId: string): Promise<void>;

  /**
   * 将一个正在生成的词存储到内存中
   * @param wordId 单词ID
   * @param readableStream 可读流
   * @returns Promise<void>
   */
  createProcessingWord(wordId: string, readableStream: ReadableStream): Promise<void>;

  /**
   * 从MySQL中获取单词的全量数据
   * @param wordId 单词ID
   * @returns Promise<Word> 返回一个Promise，resolve的结果是一个Word对象
   */
  getWordById(wordId: string): Promise<Word>;

  /**
   * 在MySQL中创建一个新的单词记录
   * @param word Word对象
   * @returns Promise<string> 返回一个Promise，resolve的结果是新创建的单词ID
   */
  createWord(word: Word): Promise<string>;

  /**
   * 在MySQL中删除一个单词记录
   * @param wordId 单词ID
   * @returns Promise<void>
   */
  deleteWord(wordId: string): Promise<void>;

  /**
   * 在MySQL中更新一个单词记录
   * @param wordId 单词ID
   * @param word Word对象
   * @returns Promise<void>
   */
  updateWord(wordId: string, word: Word): Promise<void>;

  /**
   * 在模块初始化时，删除MySQL中所有状态为processing的单词记录
   * @returns Promise<void>
   */
  deleteProcessingWordsOnInitialization(): Promise<void>;

  /**
   * 根据原始词查询单词的全量数据
   * @param originalWord 原始词
   * @returns Promise<Word | null> 返回一个Promise，resolve的结果是一个Word对象或null
   */
  getByOriginalWord(originalWord: string): Promise<Word | null>;
}

interface Word {
  id: string;
  status: WordStatus; // WordStatus是一个枚举类型，表示单词的状态
  promptVersion: string;
  createTime: Date;
  wordDoc?: string; // wordDoc是一个可选属性，表示单词的详细信息，可能在单词创建时为空，后续通过updateWord方法更新
}

enum WordStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed'
}
```

## 方法详解

### deleteProcessingWord

该方法用于从内存中移除正在生成状态中的词。传入一个单词ID，该方法会从内存中的processingWordMap中删除对应的记录。

### createProcessingWord

该方法用于将一个正在生成的词存储到内存中。传入一个单词ID和一个可读流，该方法会将这两个参数存储到内存中的processingWordMap中。同时，该方法会监听传入的可读流，当可读流结束时，会自动调用deleteProcessingWord方法，从内存中删除对应的记录。

### getWordById

该方法用于从MySQL中获取单词的全量数据。传入一个单词ID，该方法会在MySQL中查询对应的记录，并返回一个包含单词全量数据的Promise。

### createWord

该方法用于在MySQL中创建一个新的单词记录。传入一个Word对象，该方法会在MySQL中插入一条新的记录，并返回一个包含新创建的单词ID的Promise。

### deleteWord

该方法用于在MySQL中删除一个单词记录。传入一个单词ID，该方法会在MySQL中删除对应的记录。

### updateWord

该方法用于在MySQL中更新一个单词记录。传入一个单词ID和一个Word对象，该方法会在MySQL中找到对应的记录，并使用传入的Word对象更新该记录。

### deleteProcessingWordsOnInitialization

该方法在模块初始化时调用，用于删除MySQL中所有状态为processing的单词记录。因为processing状态的单词相关的信息存储在内存中，如果服务崩溃，这些信息会丢失，所以需要在服务启动时清理MySQL中的这些记录。

### getByOriginalWord

该方法用于根据原始词查询单词的全量数据。传入一个原始词，该方法会在MySQL中查询对应的记录，如果查到了，返回一个包含单词全量数据的Promise，如果查不到，返回null。

# DialogDb 模块文档

## 模块概述

DialogDb模块是一个依赖于MySQL的模块，主要负责对对话的增删改查操作。该模块包含3个方法，这些方法都强依赖于MySQL中的dialogue表。

## 接口定义

```typescript
interface DialogDb {
  /**
   * 创建一个新的对话
   * @param messages Message对象的数组
   * @returns Promise<string> 返回一个Promise，resolve的结果是新创建的对话ID
   */
  createDialog(messages: Message[]): Promise<string>;

  /**
   * 获取一个对话的全量消息
   * @param dialogId 对话ID
   * @returns Promise<Message[]> 返回一个Promise，resolve的结果是Message对象的数组
   */
  getDialog(dialogId: string): Promise<Message[]>;

  /**
   * 基于一个已有的对话创建一个新的对话
   * @param dialogId 对话ID
   * @param messages Message对象的数组
   * @returns Promise<string> 返回一个Promise，resolve的结果是新创建的对话ID
   */
  forkDialog(dialogId: string, messages: Message[]): Promise<string>;
}

interface Message {
  sender: string;
  content: string;
}
```

## 方法详解

### createDialog

该方法用于创建一个新的对话。传入一个Message对象的数组，该方法会在MySQL中插入一条新的记录，并返回一个包含新创建的对话ID的Promise。

### getDialog

该方法用于获取一个对话的全量消息。传入一个对话ID，该方法会在MySQL中查询对应的记录，并返回一个包含全量消息的Promise。该方法首先会查询对话的依赖对话ID列表（denpendent_diolog_id_list），然后获取依赖对话的消息列表和对话自身的消息列表，最后将这两个消息列表合并作为结果返回。

### forkDialog

该方法用于基于一个已有的对话创建一个新的对话。传入一个对话ID和一个Message对象的数组，该方法会在MySQL中插入一条新的记录，并返回一个包含新创建的对话ID的Promise。该方法首先会查询对话的依赖对话ID列表（denpendent_diolog_id_list），然后生成新的依赖对话ID列表，该列表包含传入的对话ID和原依赖对话ID列表。然后，该方法会将新的依赖对话ID列表和传入的消息列表写入MySQL，最后返回新创建的对话ID。

## denpendent_diolog_id_list 逻辑说明

`denpendent_diolog_id_list` 是一个字段，用于存储当前 Dialog 所依赖的 Dialog 的 ID 列表。这个字段的设计是为了实现 Dialog 的增量存储，即每次存储一个新的 Dialog，我们并不存储全量的数据，只存储与某个 Dialog 的差异部分。

这个字段的使用主要在 `getDialog` 和 `forkDialog` 方法中。

在 `getDialog` 方法中，我们需要获取一个 Dialog 的全量 message_list。首先，我们会查询当前 Dialog 的 `denpendent_diolog_id_list`，然后获取这些依赖 Dialog 的 message_list，再加上当前 Dialog 自身的 message_list，合并后就得到了全量的 message_list。

在 `forkDialog` 方法中，我们需要基于一个已有的 Dialog 创建一个新的 Dialog。首先，我们会查询当前 Dialog 的 `denpendent_diolog_id_list`，然后生成新的依赖 Dialog ID 列表，该列表包含原依赖 Dialog ID 列表和传入的 Dialog ID。然后，我们会将新的依赖 Dialog ID 列表和传入的 message_list 写入数据库，最后返回新创建的 Dialog ID。

举个例子，假设我们有以下 Dialog：

- Dialog 1：message_list 为 ["Hello"]
- Dialog 2：依赖 Dialog 1，message_list 为 ["I am Bird"]
- Dialog 3：依赖 Dialog 2，message_list 为 ["What's your name"]

在这个例子中，Dialog 1 的 `denpendent_diolog_id_list` 为空，Dialog 2 的 `denpendent_diolog_id_list` 为 [1]，Dialog 3 的 `denpendent_diolog_id_list` 为 [1, 2]。

当我们调用 `getDialog(3)` 时，我们首先会查询 Dialog 3 的 `denpendent_diolog_id_list`，得到 [1, 2]，然后获取 Dialog 1 和 Dialog 2 的 message_list，再加上 Dialog 3 自身的 message_list，合并后得到全量的 message_list ["Hello", "I am Bird", "What's your name"]。

当我们调用 `forkDialog(3, ["My name is Bird"])` 时，我们首先会查询 Dialog 3 的 `denpendent_diolog_id_list`，得到 [1, 2]，然后生成新的依赖 Dialog ID 列表 [1, 2, 3]，然后将新的依赖 Dialog ID 列表和传入的 message_list ["My name is Bird"] 写入数据库，假设返回的新 Dialog ID 为 4，那么 Dialog 4 的 `denpendent_diolog_id_list` 就为 [1, 2, 3]。

# FeedDb 模块文档

## 模块概述

FeedDb模块是一个依赖于MySQL的模块，主要负责对推荐内容的管理。该模块包含4个方法，所有方法都依赖于MySQL。

## 接口定义

```typescript
interface FeedDb {
  /**
   * 获取最新的对话
   * @param top 返回的对话数量，最大为100
   * @param wordId 单词ID
   * @returns Promise<Dialog[]> 返回一个Promise，resolve的结果是一个Dialog数组
   */
  getNewestChat(top: number, wordId: string): Promise<Dialog[]>;

  /**
   * 获取最新的单词
   * @param top 返回的单词数量，最大为100
   * @returns Promise<Word[]> 返回一个Promise，resolve的结果是一个Word数组
   */
  getNewestWord(top: number): Promise<Word[]>;

  /**
   * 写入最新的对话
   * @param dialogId 对话ID
   * @param dialogTitle 对话标题
   * @returns Promise<void>
   */
  writeNewestChat(dialogId: string, dialogTitle: string): Promise<void>;

  /**
   * 写入最新的单词
   * @param wordId 单词ID
   * @param originalWord 原始单词
   * @returns Promise<void>
   */
  writeNewestWord(wordId: string, originalWord: string): Promise<void>;
}

interface Dialog {
  id: string;
  title: string;
}

interface Word {
  id: string;
  originalWord: string;
}
```

## 方法详解

### getNewestChat

该方法用于获取最新的对话。传入一个返回的对话数量和一个单词ID，该方法会在MySQL中查询对应的记录，并返回一个包含最新对话的Promise。

### getNewestWord

该方法用于获取最新的单词。传入一个返回的单词数量，该方法会在MySQL中查询对应的记录，并返回一个包含最新单词的Promise。

### writeNewestChat

该方法用于写入最新的对话。传入一个对话ID和一个对话标题，该方法会在MySQL中插入一条新的记录。同时，如果对应单词的对话数量超过100，该方法会删除最旧的对话。

### writeNewestWord

该方法用于写入最新的单词。传入一个单词ID和一个原始单词，该方法会在MySQL中插入一条新的记录。同时，如果单词数量超过100，该方法会删除最旧的单词。

# Feed 模块文档

## 模块概述

Feed模块是一个处理推荐相关的类，主要负责获取和推送推荐的对话和单词。该模块包含4个方法，所有方法都依赖于FeedDb模块。

## 接口定义

```typescript
interface Feed {
  /**
   * 获取推荐的对话
   * @param wordId 单词ID
   * @returns Promise<{newest: Dialog[]}> 返回一个Promise，resolve的结果是一个包含最新对话的对象
   */
  getChatFeed(wordId: string): Promise<{newest: Dialog[]}>;

  /**
   * 获取推荐的单词
   * @returns Promise<{newest: Word[]}> 返回一个Promise，resolve的结果是一个包含最新单词的对象
   */
  getWordFeed(): Promise<{newest: Word[]}>;

  /**
   * 推送新的对话
   * @param dialogId 对话ID
   * @param dialogTitle 对话标题
   * @param wordId 单词ID
   * @returns Promise<void>
   */
  pushNewChat(dialogId: string, dialogTitle: string, wordId: string): Promise<void>;

  /**
   * 推送新的单词
   * @param wordId 单词ID
   * @param originalWord 原始单词
   * @returns Promise<void>
   */
  pushNewWord(wordId: string, originalWord: string): Promise<void>;
}

interface Dialog {
  id: string;
  title: string;
}

interface Word {
  id: string;
  originalWord: string;
}
```

## 方法详解

### getChatFeed

该方法用于获取推荐的对话。传入一个单词ID，该方法会调用FeedDb模块的getNewestChat方法获取最新的对话，并返回一个包含最新对话的Promise。

### getWordFeed

该方法用于获取推荐的单词。该方法会调用FeedDb模块的getNewestWord方法获取最新的单词，并返回一个包含最新单词的Promise。

### pushNewChat

该方法用于推送新的对话。传入一个对话ID、对话标题和单词ID，该方法会调用FeedDb模块的writeNewestChat方法将新的对话写入数据库。

### pushNewWord

该方法用于推送新的单词。传入一个单词ID和原始单词，该方法会调用FeedDb模块的writeNewestWord方法将新的单词写入数据库。

# WordStore 模块文档

## 模块概述

WordStore模块是一个依赖于WordDb模块和PromptGenerator模块的模块，主要负责对单词的查询和创建操作。该模块包含3个方法，分别是getByWord、getById和createWord。

## 接口定义

```typescript
interface WordStore {
  /**
   * 根据原始词查询单词信息
   * @param originalWord 原始词
   * @returns Promise<WordInfo> 返回一个Promise，resolve的结果是一个WordInfo对象
   */
  getByWord(originalWord: string): Promise<WordInfo>;

  /**
   * 根据单词ID查询单词全量信息
   * @param wordId 单词ID
   * @returns Promise<WordFullInfo> 返回一个Promise，resolve的结果是一个WordFullInfo对象
   */
  getById(wordId: string): Promise<WordFullInfo>;

  /**
   * 创建一个新的单词
   * @param params 创建单词所需的参数，包括originalWord和readableStream
   * @returns Promise<string> 返回一个Promise，resolve的结果是新创建的单词ID
   */
  createWord(params: { originalWord: string; readableStream: ReadableStream }): Promise<string>;
}

interface WordInfo {
  id: string;
  status: WordStatus; // WordStatus是一个枚举类型，表示单词的状态
  promptVersion: string;
  createTime: Date;
}

interface WordFullInfo extends WordInfo {
  wordDoc?: string; // wordDoc是一个可选属性，表示单词的详细信息，可能在单词创建时为空，后续通过updateWord方法更新
  readableStream?: ReadableStream; // readableStream是一个可选属性，表示单词生成过程中的可读流，可能在单词生成过程中存在，生成完成后为空
}

enum WordStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed'
}
```

## 方法详解

### getByWord

该方法用于根据原始词查询单词信息。传入一个原始词，该方法会调用WordDb模块的getByWord方法，在数据库中查询对应的记录，并返回一个包含单词信息的Promise。需要注意的是，返回的单词信息中并不包含wordDoc，因为wordDoc可能会比较大，一般来说这个方法只是用来验证单词是否存在，而不是用来获取单词的全量数据。

### getById

该方法用于根据单词ID查询单词全量信息。传入一个单词ID，该方法会调用WordDb模块的getWordById方法，在数据库中查询对应的记录。如果查询到的记录中wordDoc为空，并且状态为PROCESSING，说明单词正在生成过程中，此时会调用WordDb模块的getProcessingWord方法，获取单词生成过程中的可读流。最后，返回一个包含单词全量信息的Promise，如果单词正在生成过程中，全量信息中会包含可读流。

### createWord

该方法用于创建一个新的单词。传入一个包含originalWord和readableStream的对象，该方法会首先调用PromptGenerator模块的getPromptVersion方法，获取当前使用的prompt的版本号。然后，调用WordDb模块的getByWord方法，检查数据库中是否已经存在相同的原始词。如果存在，会调用WordDb模块的deleteWord和deleteProcessingWord方法，删除已存在的单词。然后，调用WordDb模块的createWord方法，创建一个新的单词记录，并将状态设置为PROCESSING。同时，调用WordDb模块的createProcessingWord方法，将传入的可读流存储到内存中。最后，监听传入的可读流，当可读流结束时，调用WordDb模块的updateWord方法，将生成的单词数据更新到数据库中。如果在生成过程中出现错误，或者生成超时（超过20分钟），会调用WordDb模块的deleteWord和deleteProcessingWord方法，删除生成失败的单词。最后，返回一个包含新创建的单词ID的Promise。

# DialogStore 模块文档

## 模块概述

DialogStore模块是一个依赖于DialogDb模块的模块，主要负责对对话的创建、查询和追加操作。该模块包含3个方法，这些方法都强依赖于DialogDb模块。

## 接口定义

```typescript
interface DialogStore {
  /**
   * 创建一个新的对话
   * @param messages Message对象的数组
   * @returns Promise<string> 返回一个Promise，resolve的结果是新创建的对话ID
   */
  createDialog(messages: Message[]): Promise<string>;

  /**
   * 获取一个对话的全量消息
   * @param dialogId 对话ID
   * @returns Promise<Message[]> 返回一个Promise，resolve的结果是Message对象的数组
   */
  getDialog(dialogId: string): Promise<Message[]>;

  /**
   * 基于一个已有的对话创建一个新的对话
   * @param dialogId 对话ID
   * @param messages Message对象的数组
   * @returns Promise<string> 返回一个Promise，resolve的结果是新创建的对话ID
   */
  appendMessage({dialogId, newMessages}: {dialogId: string, newMessages: Message[]}): Promise<string>;
}

interface Message {
  sender: string;
  content: string;
}
```

## 方法详解

### createDialog

该方法用于创建一个新的对话。传入一个Message对象的数组，该方法会调用DialogDb模块的createDialog方法，将Message对象的数组传入，然后返回一个包含新创建的对话ID的Promise。

### getDialog

该方法用于获取一个对话的全量消息。传入一个对话ID，该方法会调用DialogDb模块的getDialog方法，将对话ID传入，然后返回一个包含全量消息的Promise。

### appendMessage

该方法用于基于一个已有的对话追加新的消息。传入一个对象，该对象包含对话ID和一个Message对象的数组。该方法会调用`DialogDb`模块的`forkDialog`方法，将对话ID和新的消息数组传入，`forkDialog`方法会在原有对话的基础上追加新的消息，并创建一个新的对话。最后，`appendMessage`方法返回一个包含新创建的对话ID的Promise。

## 其他模块的调用

DialogStore模块主要依赖于DialogDb模块，所有的方法都会调用DialogDb模块的方法。在createDialog和getDialog方法中，DialogStore模块直接调用DialogDb模块的同名方法。在appendMessage方法中，DialogStore模块会调用DialogDb模块的forkDiolog方法

# PromptGenerator 模块文档

## 模块简介

PromptGenerator模块主要负责生成和解析与GPT模型交互的prompt。该模块包含一个特殊的属性`promptVersion`和七个主要的方法，每个方法都是一个对象，包含`modelConf`、`generatePrompts`和`parseResponse`三个属性。

## 属性详解

### promptVersion

该属性返回一个字符串类型的版本号。

### legalAuditForward

该方法用于检查用户输入的文本是否为合法的单词。

- `modelConf`: 配置GPT模型的参数，包括`model`和`temperature`。`model`为字符串类型，值为"3.5"，表示使用的GPT模型版本；`temperature`为数值类型，值为0，表示生成的文本的随机性。
- `generatePrompts`: 该方法接收一个字符串类型的参数`word`，表示用户输入的文本，返回一个包含prompt对象的数组。
- `parseResponse`: 该方法接收一个`messageItem`，表示GPT返回的消息，返回一个对象，包含`isLegal`和`reason`两个属性，分别表示输入的单词是否合法和原因。

### getRelatedWords

该方法用于获取与用户输入的单词相关的单词。

- `modelConf`: 配置GPT模型的参数，包括`model`和`temperature`。`model`为字符串类型，值为"3.5"；`temperature`为数值类型，值为0。
- `generatePrompts`: 该方法接收一个字符串类型的参数`userText`，表示用户输入的文本，返回一个包含prompt对象的数组。
- `parseResponse`: 该方法接收一个`messageItem`，返回一个对象，包含一个`relatedWords`属性，表示相关的单词列表。

### createWordDoc

该方法用于生成单词的详细解释。

- `modelConf`: 配置GPT模型的参数，包括`model`和`temperature`。`model`为字符串类型，值为"4"；`temperature`为数值类型，值为0.2。
- `generatePrompts`: 该方法接收一个字符串类型的参数`originWord`，表示用户输入的单词，返回一个包含prompt对象的数组。
- `parseResponse`: 该方法接收一个`messageItem`，返回一个对象，包含一个`wordDoc`属性，表示单词的详细解释。

### generateChatTitle

该方法用于生成对话的标题。

- `modelConf`: 配置GPT模型的参数，包括`model`和`temperature`。`model`为字符串类型，值为"4"；`temperature`为数值类型，值为0.2。
- `generatePrompts`: 该方法接收一个数组类型的参数`historicalMessageList`，表示历史消息列表，返回一个包含prompt对象的数组。
- `parseResponse`: 该方法接收一个`messageItem`，返回一个对象，包含一个`title`属性，表示生成的对话标题。

### legalAuditForWordQuestion

该方法用于检查用户提交的问题是否合法。

- `modelConf`: 配置GPT模型的参数，包括`model`和`temperature`。`model`为字符串类型，值为"4.3"；`temperature`为数值类型，值为0。
- `generatePrompts`: 该方法接收一个字符串类型的参数`historicalQuestion`，表示用户提交的问题，返回一个包含prompt对象的数组。
- `parseResponse`: 该方法接收一个`messageItem`，返回一个对象，包含`isLegal`和`reason`两个属性，分别表示问题是否合法和原因。

### appendAMessageToWordDialogue

该方法用于向单词对话中追加一条消息。

- `modelConf`: 配置GPT模型的参数，包括`model`和`temperature`。`model`为字符串类型，值为"4"；`temperature`为数值类型，值为0.2。
- `generatePrompts`: 该方法接收一个字符串类型的参数`historicalQuestion`，表示用户提交的问题，返回一个包含prompt对象的数组。
- `parseResponse`: 该方法接收一个`messageItem`，返回一个对象，包含一个`message`属性，表示GPT返回的消息。

### createWordQuestionDialogue

该方法用于创建一个新的单词问题对话。

- `modelConf`: 配置GPT模型的参数，包括`model`和`temperature`。`model`为字符串类型，值为"4"；`temperature`为数值类型，值为0.2。
- `generatePrompts`: 该方法接收一个对象类型的参数，包含`originWord`和`wordDoc`两个属性，分别表示用户输入的单词和单词的详细解释，返回一个包含prompt对象的数组。
- `parseResponse`: 该方法接收一个`messageItem`，返回一个对象，包含一个`message`属性，表示GPT返回的消息。

## 方法详解

### legalAuditForward

该方法首先通过`generatePrompts`方法生成prompt，然后将prompt发送给GPT模型。GPT模型返回的消息通过`parseResponse`方法进行解析，得到输入的单词是否合法和原因。

### getRelatedWords

该方法首先通过`generatePrompts`方法生成prompt，然后将prompt发送给GPT模型。GPT模型返回的消息通过`parseResponse`方法进行解析，得到与输入的单词相关的单词列表。

### createWordDoc

该方法首先通过`generatePrompts`方法生成prompt，然后将prompt发送给GPT模型。GPT模型返回的消息通过`parseResponse`方法进行解析，得到单词的详细解释。

### generateChatTitle

该方法首先通过`generatePrompts`方法生成prompt，然后将prompt发送给GPT模型。GPT模型返回的消息通过`parseResponse`方法进行解析，得到对话的标题。

### legalAuditForWordQuestion

该方法首先通过`generatePrompts`方法生成prompt，然后将prompt发送给GPT模型。GPT模型返回的消息通过`parseResponse`方法进行解析，得到用户提交的问题是否合法和原因。

### appendAMessageToWordDialogue

该方法首先通过`generatePrompts`方法生成prompt，然后将prompt发送给GPT模型。GPT模型返回的消息通过`parseResponse`方法进行解析，得到GPT返回的消息。

### createWordQuestionDialogue

该方法首先通过`generatePrompts`方法生成prompt，然后将prompt发送给GPT模型。GPT模型返回的消息通过`parseResponse`方法进行解析，得到GPT返回的消息。