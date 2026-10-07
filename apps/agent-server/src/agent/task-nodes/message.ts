import { createChatModel } from '../../ai/model.js'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'

export const handleMessageTask = async state => {
  const model = createChatModel()
  const { page, selectedNodeIds, messages, schema } = state
  const { nodes, canvas } = page
  const { material, canvas: canvasSchema } = schema
  const _messages = [...messages]
  const lastMessage = _messages.pop()
  const result = await model.invoke([
    new SystemMessage('你是一个 AI 大屏设计器助手，帮助用户设计大屏页面。'),
    ..._messages,
    new HumanMessage(`
      用户问题：${lastMessage.text}
      
      以下是当前设计器的状态：
      ${JSON.stringify({ nodes, canvas, selectedNodeIds }, null, 2)}
      
      其中：
      - nodes: 当前页面的所有节点。
      - canvas: 当前画布的属性信息，包括画布的宽高、背景色等。
      - selectedNodeIds: 当前选中的节点 ID 列表。
      
      以下是 canvas 画布的 schema 定义：
      ${JSON.stringify(canvasSchema, null, 2)}
      
      以下是所有可用物料的 schema 定义：
      ${JSON.stringify(material, null, 2)}
    `),
  ])

  return {
    messages: [result],
  }
}
