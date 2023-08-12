##  /word/info/:word_id 获取单词信息

### 基本信息

返回单词数据，包括单词的详细说明和当前状态。

| 路径 | 调用方法 | 依赖 |
|---|---|---|
| /word/info/:word_id | WebSocket | WordStore |

### 结构定义

```typescript
interface WordDocFragmentMsg {
  /**
   * 单词的详细说明的判断，Markdown 格式
   */
  word_doc_fragment: string;
  /**
   * 是否已经完成
   */
  done: boolean;
}
```

### 输入信息

```typescript
interface PathParam {
  /**
   * 单词的id
   */
  word_id: string;
}
```

### 输出信息

```typescript
interface WsServerMessage {
  /**
   * 单词的详细说明，Markdown 格式。只有 status=existing 才会存在
   */
  word_doc?: string;
  /**
   * 词当前的状态
   */
  status: 'generating' | 'not_found' | 'existing';
  /**
   * 这个单词的单词本身
   */
  origin_word: string;
}
```

### 运行原理

1. 接口会调用 `WordStore.getById` 方法，传入 `word_id` 查询数据。
2. 该方法会首先返回单词的详细说明（如果存在）、词当前的状态和这个单词的单词本身。
3. 当词为 status = generating 时，服务器会在随后推送数个 WordDocFragmentMsg 结构，来动态的告知客户端当前词的生成进度。

### 例子

#### 1. status = existing

```json
{
  "word_doc": "Apple is a fruit...",
  "status": "existing",
  "origin_word": "apple"
}
```

#### 2. status = not_found

```json
{
  "status": "not_found",
  "origin_word": "appl"
}
```

#### 3. status = generating

```json
{
  "status": "generating",
  "origin_word": "appl"
}
```

在生成过程中，服务器会源源不断的推送 WordDocFragmentMsg 结构，例如：

```json
{
  "word_doc_fragment": "Appl is a common misspelling of the word apple...",
  "done": false
}
```

```json
{
  "word_doc_fragment": "It is often seen in quick typing or mistyping scenarios...",
  "done": false
}
```

```json
{
  "word_doc_fragment": "In computer science, APPL is an acronym for Application...",
  "done": true
}
```

客户端应该不断的拼接 word_doc_fragment，最终形成一个完整的 word_doc：

```markdown
Appl is a common misspelling of the word apple...
It is often seen in quick typing or mistyping scenarios...
In computer science, APPL is an acronym for Application...
```



##  /word/submit 提交词

### 基本信息

提交一个词，生成词的解释文档。

| 路径 | 调用方法 | 依赖 | 可能的 errcode |
|---|---|---|---|
| /word/submit | POST | PromptGenerator, Momo, WordStore, Feed | 401 |

### 输入信息

```typescript
interface PostWordSubmit {
  /**
   * 用户输入的词
   */
  word: string;
}
```

### 输出信息

```typescript
interface PostWordSubmitResponse {
  /**
   * 错误码，非0都代表错误
   */
  errcode: number;
  /**
   * 报错信息
   */
  errmsg: string;
  /**
   * 词的id
   */
  word_id: number;
}
```

### 运行原理

1. 接口接收到用户输入的词 `word`，首先调用 `PromptGenerator.legalAudit4Word` 来生成一段 Prompts，然后调用 Momo 模块，传入 Prompts，Momo 模块会返回这个单词是不是合法的，如果是合法的，则会返回原始的词，也就是 `origin_word`。
2. 接口会调用 `WordStore.getByWord` 来获取词信息，看看是不是之前生成过，大概有4种情况：
    1. 词不存在：执行“提交任务”流程，返回 `word_id` 让前端直接重定向到对应的单词详情页。
    1. 词已经存在，但是内置的 Prompts 更新了。这种情况下也可以重新生成 word_doc，执行“提交任务”流程，返回 `word_id` 让前端直接重定向到对应的单词详情页。
    1. 词正在生成：返回让前端重定向的响应体，前端可以直接打开“单词详情页”。阻止提交，返回 `word_id` 让前端直接重定向到对应的单词详情页。
    1. 已经存在且Prompts也相同：和“词正在生成”，都是阻止提交，返回 `word_id` 让前端跳转，同时会回复友好的报错（errcode=401）。前端应该展现报错，并引导用户跳转而不是自动跳转。

### 提交任务流程

1. **生成 Prompts**：根据 `origin_word` 调用 `PromptGenerator.submitWord` 接口生成 Prompts。
2. **提交 Prompts**：将生成的 Prompts 提交给 Momo 模块。
3. **获取 Readable Stream**：Momo 模块会返回一个 Readable Stream。
4. **存储 Readable Stream**：调用 `WordStore.createWord` 接口，将 Readable Stream 和 `origin_word` 一起存储。这个方法会返回新生成的 `word_id`。
5. **返回 word_id**：接口返回 `word_id` 给前端，让前端自动跳转到对应的单词详情页。
6. **保存新词**：当 Readable Stream 结束后，调用 `Feed.postNewWord` 保存新词。

### 可能的 errcode

| errcode | 描述 | 解决方案 |
|---|---|---|
| 401 | 词已经存在且Prompts也相同 | 前端应该展现报错，并引导用户跳转而不是自动跳转 |



##  /search 搜索词

### 基本信息

处理对输入词的搜索请求，返回可能的单词候选项。

### 输入信息

| 路径 | 调用方法 | 依赖 |
|---|---|---|
| /search | WebSocket | PromptGenerator, Momo, WordStore |

```typescript
interface WsClientMessage {
  /**
   * 用户输入的文本
   */
  user_text: string;
}
```

### 输出信息

```typescript
interface WsServerMessage {
  /**
   * 用户输入的文本
   */
  user_text: string;
  /**
   * 可能的单词候选项
   */
  candidates: string[];
}
```

### 运行原理

1. 接口接收到用户输入的文本 `user_text`，首先进行空格和特殊字符的清理，生成 `safe_text`。
2. 下面的步骤同步进行：
   1. 精确搜索：接口会用 `WordStore.getByWord` 方法根据已清理过的输入（`safe_text`）获取词的基本信息。如果单词已经存在，那么接口会直接通过可读流将结果返回给前端。
   1. 模糊搜索：接口会先使用`safe_text` 传入 `PromptGenerator.getRelatedWords` 方法生成一段 `prompts`，然后将 `prompts` 通过 Momo 小鸟模块发给 AI 模型，获得可能的相关词列表（`word_list`）。 然后，对 `word_list` 中的每一个词，接口通过 `WordStore.getByWord` 方法，查看是否在数据库中已经存在，如果存在，也会将它返回给前端。
3. 处理精确匹配和模糊匹配的过程是同步进行的，谁有结果就马上返回，返回后不影响另外的一个搜索步骤。



### 例子

1. 用户输入 "appl"，返回：

```json
{
  "user_text": "appl",
  "candidates": ["apple", "application"]
}
```

2. 用户输入 "apple"，返回：

```json
{
  "user_text": "apple",
  "candidates": ["apple"]
}
```



##  /feed/word 获取推荐单词列表

### 基本信息

获取推荐阅读的词列表，目前只有最新创建的词，20个。

| 路径       | 调用方法 | 依赖 |
| ---------- | -------- | ---- |
| /feed/word | HTTP Get | Feed |

### 输入信息

无

### 输出信息

```typescript
interface FeedWordResponse {
  /**
   * 最新的单词列表
   */
  newest: {
    /**
     * 单词的id
     */
    word_id: string;
    /**
     * 原始词
     */
    origin_word: string;
  }[];
}
```

### 运行原理

1. 接口会调用 `Feed.getNewestWords` 方法，获取最新的20个单词。
2. 返回一个包含这20个单词的数组，每个单词包含 `word_id` 和 `origin_word`。

### 例子

#### 用户请求推荐的单词列表，返回：

```json
{
  "newest": [
    {
      "word_id": "1",
      "origin_word": "apple"
    },
    {
      "word_id": "2",
      "origin_word": "banana"
    },
    // ...
  ]
}
```

##  /feed/chat 获取推荐对话列表

### 基本信息

获取某个词下面推荐阅读的对话列表，当用户对话完成后，关闭是点击“有帮助”会被记录为一次有效的对话，然后可以从这个接口取到。目前也只有最新创建的对话，20个。

| 路径       | 调用方法 | 依赖 |
| ---------- | -------- | ---- |
| /feed/chat | HTTP Get | Feed |

### 输入信息

```typescript
interface QueryString {
  /**
   * 单词的id
   */
  word_id: string;
}
```

### 输出信息

```typescript
interface FeedChatResponse {
  /**
   * 最新的对话列表
   */
  newest: {
    /**
     * 对话的id
     */
    dialog_id: string;
    /**
     * 对话标题
     */
    dialog_title: string;
  }[];
}
```

### 运行原理

1. 接口会调用 `Feed.getNewestDialogs` 方法，传入 `word_id`，获取最新的20个对话。
2. 返回一个包含这20个对话的数组，每个对话包含 `dialog_id` 和 `dialog_title`。

### 例子

#### 用户请求单词 "apple" 的推荐对话列表，返回：

```json
{
  "newest": [
    {
      "dialog_id": "1",
      "dialog_title": "Discussion about the origin of apple"
    },
    {
      "dialog_id": "2",
      "dialog_title": "The nutritional value of apple"
    },
    // ...
  ]
}
```

##  /feed/push/chat 记录有帮助的对话

### 基本信息

当用户在对话结束后，选择"该对话对我有帮助"并关闭对话窗口时，前端会调用该接口，向后端传递这个对话的id。

| 路径            | 调用方法  | 依赖                                     |
| --------------- | --------- | ---------------------------------------- |
| /feed/push/chat | HTTP Post | Feed, DialogStore, PromptGenerator, Momo |

### 输入信息

```typescript
interface FeedPushChatRequest {
  /**
   * 对话的id
   */
  dialog_id: string;
}
```

### 输出信息

无

### 运行原理

1. 接口会调用 `DialogStore.getById` 方法，传入 `dialog_id`，获取对话的全部消息列表。
2. 接口会调用 `PromptGenerator.generateChatTitle` 方法，传入消息列表，生成一段提示。
3. 接口会调用 `Momo` 模块，传入提示和消息列表，生成对话标题。
4. 接口会调用 `Feed.pushNewChat` 方法，传入对话id和对话标题，将对话记录下来。

### 例子

#### 用户结束对话，选择"该对话对我有帮助"，前端发送请求：

```json
{
  "dialog_id": "1"
}
```

## /chat/history/:dialog_id 获取对话历史记录

### 基本信息

获取对话的详细数据，实际上就是该对话的消息记录。

| 路径                     | 调用方法 | 依赖        |
| ------------------------ | -------- | ----------- |
| /chat/history/:dialog_id | HTTP Get | DialogStore |

### 输入信息

```typescript
interface PathParam {
  /**
   * 对话的id
   */
  dialog_id: string;
}
```

### 输出信息

```typescript
interface ChatHistoryResponse {
  /**
   * 对话的消息记录
   */
  messages: {
    /**
     * 消息的id
     */
    message_id: string;
    /**
     * 消息的内容
     */
    content: string;
    /**
     * 消息的发送者，可以是 'user' 或 'ai'
     */
    sender: 'user' | 'ai';
    /**
     * 消息的发送时间
     */
    timestamp: string;
  }[];
}
```

### 运行原理

1. 接口会调用 `DialogStore.getById` 方法，传入 `dialog_id`，获取到相关对话的所有消息记录。
2. 返回一个包含这些消息的数组，每个消息包含 `message_id`、`content`、`sender` 和 `timestamp`。
3. 需要注意的是，一部分特别的消息（例如，一些只用于设置上下文的消息）会在返回前被过滤掉。

### 例子

#### 用户请求对话 "1" 的历史记录，返回：

```json
{
  "messages": [
    {
      "message_id": "1",
      "content": "Hello, how can I help you?",
      "sender": "ai",
      "timestamp": "2022-01-01T00:00:00Z"
    },
    {
      "message_id": "2",
      "content": "What is the meaning of the word 'apple'?",
      "sender": "user",
      "timestamp": "2022-01-01T00:01:00Z"
    },
    // ...
  ]
}
```

## /chat/add-on 添加对话

### 基本信息

接收用户的查询的问题，然后回答用户的提问。

| 路径         | 调用方法  | 依赖                               |
| ------------ | --------- | ---------------------------------- |
| /chat/add-on | WebSocket | PromptGenerator, Momo, DiologStore |

### 结构定义

```typescript
interface AnswerFragmentMsg {
  /**
   * 答案的一部分
   */
  answer_fragment: string;
  /**
   * 是否已经完成
   */
  done: boolean;
}

interface NewDialogIdMsg {
  /**
   * 新的对话ID
   */
  new_dialog_id: string;
}
```

### 输入信息

```typescript
interface WsClientMessage {
  /**
   * 用户查询词
   */
  user_question: string;
  /**
   * 对话ID
   */
  dialog_id: string;
}
```

### 输出信息

```typescript
interface WsServerMessage {
  /**
   * 消息类型
   */
  msg_type: 'answer_fragment' | 'new_dialog_id';
  /**
   * 消息内容
   */
  msg: AnswerFragmentMsg | NewDialogIdMsg;
}
```

### 运行原理

1. 根据 dia_log_id 调用 DiologStore.getById 获取message_list（过去的交谈内容）。
2. 调用'PromptGenerator'的'generate'方法进行问题生成。这个方法需要'user_question'和过去的对话内容'message list'作为输入。
3. 传递生成的问题给 Momo 小鸟模块进行处理。
4. 如果问题合法，调用'PromptGenerator'的'appendMessage2Dialog'方法添加消息到对话中，并获取答案。
5. 创建一个可写读，存储处理模块的回答，返回给前端。
6. 更新存储的对话数据，生成新的对话ID，为下一轮对话做准备。

### 备注

在一次接口调用中，可能会返回两个新的对话ID：一个在验证用户问题合法后，一个在处理模块完成完毕答案生成后。

### 例子

#### 输入

```json
{
  "user_question": "What is the meaning of life?",
  "dialog_id": "123"
}
```

#### 输出

```json
{
  "msg_type": "answer_fragment",
  "msg": {
    "answer_fragment": "The meaning of life is a philosophical question...",
    "done": false
  }
}
```

```json
{
  "msg_type": "answer_fragment",
  "msg": {
    "answer_fragment": "Many people believe it is to find happiness and fulfillment...",
    "done": true
  }
}
```

```json
{
  "msg_type": "new_dialog_id",
  "msg": {
    "new_dialog_id": "124"
  }
}
```

## /chat/about-word/:word_id 创建对话

### 基本信息

通过一个单词ID（word_id）来创建一个新的对话。

| 路径                 | 调用方法 | 依赖                                    |
| -------------------- | -------- | --------------------------------------- |
| /chat/about-word/:id | HTTP Get | WordStore, DialogStore, PromptGenerator |

### 输入信息

```typescript
interface PathParam {
  /**
   * 单词的id
   */
  word_id: string;
}
```

### 输出信息

```typescript
interface ResponseBody {
  /**
   * 对话的id
   */
  dialog_id: string;
}
```

### 运行原理

1. 接口会调用 `WordStore.getById` 方法，传入 `word_id` 查询数据，返回 `word_doc` 和 `origin_word`。
2. 将 `origin_word` 和 `word_doc` 通过 `PromptGenerator` 方法，生成一个能够创建对话的 `prompt`。
3. 将生成的 `prompt` 记为 `message_list`，它是一个数组，里面都是一条一条的消息，也可以理解为 `prompt`。
4. 将 `message_list` 传给 `DialogStore.createDialog` 方法，该方法会将这些信息存储起来，并返回一个 `dialog_id`。
5. 返回 `dialog_id`。

### 备注

这个接口并没有真的将生成的 `prompt` 发给 `Momo` 模块去问 AI，它只是根据这个 `word` 的一些基本信息，然后去创建一个 `dialog`。可以简单的理解为就是用 `word_id` 换 `dialog_id`。

### 例子

#### 输入

```json
{
  "word_id": "123"
}
```

#### 输出

```json
{
  "dialog_id": "456"
}
```
