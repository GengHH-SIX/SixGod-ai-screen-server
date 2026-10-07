// src/ai/model.ts
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai'

export function createChatModel(
  options?: ConstructorParameters<typeof ChatOpenAI>[0]
) {
  return new ChatOpenAI({
    model: process.env.AI_MODEL,
    // 使用 Responses API
    // useResponsesApi: true,
    modelKwargs: {
      // 注意，咱自己做的事儿，别让它看见，不往里面存
      // store: false,
      enable_thinking: false,
    },
    configuration: {
      baseURL: process.env.AI_BASE_URL,
      apiKey: process.env.AI_API_KEY,
    },
    ...options,
  })
}

export function createNonStreamingModel(
  options?: Parameters<typeof createChatModel>[0]
) {
  return createChatModel({
    ...options,
    disableStreaming: true,
    tags: ['nostream'],
  })
}

export function createEmbeddingModel() {
  return new OpenAIEmbeddings({
    model: process.env.AI_EMBEDDING_MODEL,
    apiKey: process.env.AI_API_KEY,
    configuration: {
      baseURL: process.env.AI_BASE_URL,
    },
    // 单次最多处理 10 条
    batchSize: 10,
    maxConcurrency: 1,
    maxRetries: 0,
  })
}
