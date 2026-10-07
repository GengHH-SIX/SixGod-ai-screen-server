import { fileURLToPath } from 'url'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { decodeHTML } from 'entities'
import { createEmbeddingModel } from '../ai/model.ts'
import { writeKnowledgeDatabase } from '../rag/database.ts'

const ECHARTS_DOCUMENT_DIR = fileURLToPath(
  new URL('../../resources/echarts/', import.meta.url)
)

let filenames = await readdir(ECHARTS_DOCUMENT_DIR)
filenames = filenames.filter(value => value.includes('dataset'))
const chunks = []

for (const filename of filenames) {
  const document = JSON.parse(
    await readFile(join(ECHARTS_DOCUMENT_DIR, filename), 'utf8')
  )

  // dataset.source
  // series.bar.itemStyle
  const pathPrefix = filename
    .replace(/^option\./, '')
    .replace(/\.json$/, '')
    .replaceAll('-', '.')

  const documentChunks = buildChunks(document, pathPrefix)
  /**
   * {
   *   id:'xxx',
   *   path:'dataset.source',
   *   description:'数据源'
   * }
   */
  chunks.push(...documentChunks)
}

function cleanDescription(html: string) {
  return decodeHTML(
    html
      // script、style、iframe 的内部文本不是配置说明，整体删除。
      .replace(/<(script|style|iframe)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
      // 替换列表了 div、p 这些标签，当然，咱还得保留换行，要不然纯文本一大坨模型不好读。
      .replace(/<br\s*\/?\s*>|<\/(?:p|div|li|pre|h[1-6])>/gi, '\n')
      // 给列表项补上短横线，使纯文本仍能看出列表结构。
      .replace(/<li\b[^>]*>/gi, '- ')
      // 删除剩余 HTML 标签。
      .replace(/<[^>]*>/g, '')
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim()
}

function buildChunks(document, pathPrefix) {
  const chunks = []

  for (const [key, entry] of Object.entries(document)) {
    const value: any = entry
    const description = cleanDescription(value.desc)
    const path = `${pathPrefix}.${key}`

    chunks.push({
      id: crypto.randomUUID(),
      path,
      description,
    })
  }

  return chunks
}

const embeddings = createEmbeddingModel()
const vectors: number[][] = []

for (let start = 0; start < chunks.length; start += 10) {
  const batch = chunks.slice(start, start + 10)
  const texts = batch.map(
    chunk => `ECharts 配置 ${chunk.path}\n${chunk.description}`
  )

  vectors.push(...(await embeddings.embedDocuments(texts)))
}

// 把 chunks 和向量写到库里面去
writeKnowledgeDatabase(chunks, vectors)
