# 页面文档

## 首页

### 1. 页面布局

首页分为三个主要区域：

1. 顶部区域：展示平台名称和一个显眼的标志。
2. Feed区域：向用户推荐阅读的单词文档。目前只支持从新到旧的排序，展示最近全体用户提交的20个单词。
3. 搜索栏区域：用户可以搜索或提交一个单词进行查询。

### 2. Feed区域

Feed区域展示的是全体用户最近提交的20个单词，用户可以点击单词进入到对应的单词详情页。

### 3. 搜索栏区域

搜索栏区域的交互逻辑如下：

- 用户在搜索栏输入单词时，搜索栏会不断请求后端接口获取候选项。
- 用户可以在输入完后无视候选项直接回车，相当于直接提交查询。
- 用户也可以在输入后选择一个候选项进行查询。

当用户在搜索栏输入单词后直接回车，前端会调用 `/search` 接口搜索用户输入的词，有两种可能的结果：

- 精准匹配：如果用户输入的单词与之前用户提交的单词完全一致，这种情况被称为精准匹配。此时，接口会返回数据，包括单词的ID，前端会直接跳转到该单词的详情页。
- 非精准匹配：如果用户输入的单词与之前用户提交的单词不完全一致，这种情况被称为非精准匹配。此时，前端会调用 `/word/submit` 接口提交这个单词，接口会返回一个word ID，前端会跳转到该ID的详情页。

当用户在搜索栏输入单词时，前端会不断调用search接口获取候选项。服务器会根据用户的输入返回候选项，并回传用户输入的文本，前端可以根据这些信息渲染候选项。候选项分为两种：

- 精准匹配的候选项：如果有精准匹配，该候选项会排在最前面。
- 非精准匹配的候选项：如果没有精准匹配，相关的词会显示在候选项中。

所有的候选项都是用户之前提交过的词。

## 单词详情页

### 1. 页面概述

单词详情页是一个详尽的文档，解释单词的具体用法和相关知识点。页面主要分为四部分：

1. Header部分：包含网站的名称和搜索框，用户可以直接提交查询。这部分在每个页面都存在。
2. 单词文档部分：展示单词的详细信息。
3. 对话部分：用户可以提交对话，询问字典关于单词的相关信息。
4. Feed区域：展示最近其他用户提交的对话列表，推荐用户阅读。

### 2. 单词文档部分

打开页面后，首先请求`/word/info/:id`接口，根据ID获取单词的信息。页面支持多并发，如果单词的文档正在生成过程中，会通过WebSocket接口，源源不断地返回单词的文档。前端在接收到服务器的返回后，需要不断拼接，组合成一个完整的文档。如果单词的文档已经生成完毕，后端会直接返回全量的文档。后端返回的是Markdown格式的文档，前端需要使用Markdown渲染器将其渲染成一个漂亮的文档。

### 3. 对话部分

用户可以提交新的对话，询问单词相关的信息。在用户想要提交对话的时候，前端首先会创建一个dialog，调用`/chat/about-word/:word_id`接口，根据word ID获取一个dialog ID。然后，前端使用这个dialog ID调用`/chat/add-on`接口，将用户的信息追加进去。这个接口也是一个WebSocket接口，会流式地返回AI的响应。每次用户提交新的问题，或者AI回答完问题后，后端都会发送一个特殊的消息，更新dialog ID。当用户觉得问题已经解决，想要关闭对话时，前端会弹出一个窗口询问用户是否解决了问题。如果用户点击解决了，前端会调用`/feed/push/chat`接口，将dialog ID发送给后端。

### 4. Feed区域

Feed区域包含两部分：用户提交的对话列表和推荐阅读的对话列表。用户提交的对话列表只记录那些用户点击了“有帮助”的对话。推荐阅读的对话列表展示最近其他用户提交的20条对话记录。当用户打开Feed区域时，会首先调用`/feed/chat`接口，获取对话列表。列表中包含对话的标题和对话的ID。当用户点击某个对话时，会调用`/chat/history/:dialog_id`接口，获取对话的数据进行渲染。用户也可以针对某个对话进行追加提问，这个逻辑和提交对话的逻辑类似。