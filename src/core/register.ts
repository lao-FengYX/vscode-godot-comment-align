import * as vscode from 'vscode'
import { config } from '../utils/config'
import { logger } from '../utils/logger'
import { commandName } from '../utils/nameManager'

/**
 * 注册命令
 */
export const registerCommands = (context: vscode.ExtensionContext) => {
  return vscode.commands.registerCommand(commandName, async () => {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      return
    }

    const doc = editor.document
    if (doc.languageId !== 'gdscript') {
      return
    }

    logger.info(`🚀 Command triggered: ${commandName}`)
    logger.debug('Current active editor:', vscode.window.activeTextEditor?.document.fileName)

    logger.info(`📄 Document: ${doc.fileName}`)
    logger.info(`  Language: ${doc.languageId}`)
    logger.info(`  Line count: ${doc.lineCount}`)

    try {
      // ========== 第一步：执行原生格式化 ==========
      logger.info('Step 1: Executing native formatter (editor.action.formatDocument)')
      const startTime = Date.now()
      await vscode.commands.executeCommand('editor.action.formatDocument')
      const elapsedTime = Date.now() - startTime
      logger.info(`  ✅ Native formatting completed in ${elapsedTime}ms`)

      // 重新获取编辑器引用
      const newEditor = vscode.window.activeTextEditor
      if (!newEditor || newEditor.document !== doc) {
        // 文档在格式化过程中已更改 跳过
        return
      }

      // ========== 第二步：检查配置 ==========
      const indentSize = config.get<number>('commentIndentSize')
      logger.info('Step 2: Checking configuration')
      logger.debug('  Config values:', { indentSize })

      // ========== 第三步：执行注释对齐 ==========
      logger.info('Step 3: Executing comment alignment')
      const alignStartTime = Date.now()

      await alignCommentsByParagraph(newEditor)

      const alignTime = Date.now() - alignStartTime
      logger.info(`  ✅ Comment alignment completed in ${alignTime}ms`)

      const totalTime = Date.now() - startTime
      logger.info(`🎉 Total processing time: ${totalTime}ms`)
    } catch (error) {
      logger.error('Command execution failed', error)
      vscode.window.showErrorMessage(`Formatting failed: ${error}`)
    }
  })
}

/**
 * 核心：按空行分段对齐注释
 */
const alignCommentsByParagraph = async (editor: vscode.TextEditor) => {
  logger.info('🔍 Starting comment alignment analysis (by paragraph)')

  const document = editor.document
  const text = document.getText()
  const eol = document.eol === vscode.EndOfLine.LF ? '\n' : '\r\n'
  const lines = text.split(eol)

  logger.debug(`  Document has ${lines.length} lines`)

  // ===== 读取配置（预计算不变值） =====
  const indentSize = config.get<number>('commentIndentSize')
  const indentType = config.get<'space' | 'tab'>('indentType')
  const indentStr = (indentType === 'tab' ? '\t' : ' ').repeat(indentSize)
  const commentRegex = /(.*?)\s*#\s*(.*)$/

  logger.debug(`  Using indent: ${indentType} x ${indentSize}`)

  // ===== 单次遍历：按空行分割段落，同时收集注释行 =====
  logger.info('Step 1: Scanning paragraphs and collecting comments in single pass')
  const edits: vscode.TextEdit[] = []

  // 当前段落内的注释数据
  let paraCommentData: { line: number; comment: string; content: string; rawLine: string }[] = []
  let paraStart = 0

  const flushParagraph = (paraEnd: number) => {
    if (paraCommentData.length < 2) {
      logger.debug(`  Paragraph [${paraStart}-${paraEnd}]: skipped`)
      paraCommentData = []
      return
    }

    logger.debug(
      `  Paragraph [${paraStart}-${paraEnd}]: ${paraCommentData.length} comments to align`
    )

    // 计算段落内代码内容的最大宽度
    const maxStart = Math.max(0, ...paraCommentData.map((cd) => cd.content.length))

    for (const cd of paraCommentData) {
      // + 1 填充内容宽度，确保与原代码有间隔
      const spacesToAdd = maxStart - cd.content.length + 1
      // 新行内容：代码内容 + 空格 + 缩进 + 注释
      const newLine = cd.content + ' '.repeat(spacesToAdd) + indentStr + '# ' + cd.comment

      if (newLine !== cd.rawLine) {
        edits.push(
          vscode.TextEdit.replace(new vscode.Range(cd.line, 0, cd.line, cd.rawLine.length), newLine)
        )
      }
    }

    paraCommentData = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.trim() === '') {
      // 空行：结束当前段落
      flushParagraph(i - 1)
      paraStart = i + 1
      continue
    }

    const match = line.match(commentRegex)
    if (match) {
      const content = match[1] || ''
      const comment = match[2] || ''
      // 跳过纯注释行（# 前没有代码内容）
      if (content.trim() !== '') {
        paraCommentData.push({ line: i, comment, content, rawLine: line })
      }
    }
  }
  // 处理最后一段
  flushParagraph(lines.length - 1)

  // ===== 2. 应用所有编辑 =====
  if (edits.length > 0) {
    logger.info(`Step 2: Applying ${edits.length} edits to document`)
    const workspaceEdit = new vscode.WorkspaceEdit()
    workspaceEdit.set(document.uri, edits)
    await vscode.workspace.applyEdit(workspaceEdit)
    logger.info(`  ✅ ${edits.length} edits applied successfully`)
  } else {
    logger.info('  ⏭️ No edits needed, document already aligned')
  }
}
