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
      await alignComments(newEditor)
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
 * 核心：对齐注释
 */
const alignComments = async (editor: vscode.TextEditor) => {
  logger.info('🔍 Starting comment alignment analysis')

  const document = editor.document
  const text = document.getText()
  const eol = document.eol === vscode.EndOfLine.LF ? '\n' : '\r\n'
  const lines = text.split(eol)

  logger.debug(`  Document has ${lines.length} lines`)

  // ===== 读取配置：缩进大小 =====
  const indentSize = config.get<number>('commentIndentSize')
  logger.debug(`  Using indent size: ${indentSize}`)

  // ===== 1. 收集所有注释行 =====
  logger.info('Step 1: Collecting comment lines')
  const commentData: { line: number; comment: string; content: string; indent: number }[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const match = line.match(/(.*?)\s*#\s*(.*)$/)
    if (match) {
      const content = match[1] || ''
      const comment = match[2] || ''

      // 注释行 或 空行
      if (content.trim() === '') continue
      commentData.push({
        line: i,
        comment: comment,
        content: content,
        indent: match[1].length || 0
      })
    }
  }

  if (!commentData.length) return

  // ===== 2. 按连续行分组 =====
  logger.info('Step 2: Grouping consecutive comment lines')
  const groups: Map<number, typeof commentData> = new Map()
  let prevLine = commentData[0].line

  for (let i = 0; i < commentData.length; i++) {
    const cd = commentData[i]

    if (groups.has(prevLine)) {
      groups.get(prevLine)!.push(cd)
    } else {
      groups.set(prevLine, [cd])
    }

    const nextCd = i + 1 < commentData.length ? commentData[i + 1] : null
    if (nextCd && nextCd.line !== cd.line + 1) {
      prevLine = nextCd.line
    }
  }

  // ===== 3. 对每组进行对齐 =====
  logger.info('Step 3: Calculating alignment positions')
  const edits: vscode.TextEdit[] = []

  groups.forEach((g, idx) => {
    logger.debug(`  Processing group ${idx + 1}: ${g.length} comments`)

    // 计算该组中 # 后面第一个非空格字符的最大列位置
    const maxStart = Math.max(0, ...g.map((cd) => cd.content.length))

    logger.debug(`  Group ${idx + 1} target alignment column: ${maxStart}`)

    // 对组内每一行生成编辑
    let editCount = 0
    for (const cd of g) {
      const spacesToAdd = maxStart - cd.content.length + 1
      const spaceStr = ' '.repeat(spacesToAdd)
      // 使用配置的缩进
      const indent = '\t'.repeat(indentSize)
      const newLine = cd.content + spaceStr + indent + '# ' + cd.comment

      if (newLine !== lines[cd.line]) {
        const range = new vscode.Range(cd.line, 0, cd.line, newLine.length)
        edits.push(vscode.TextEdit.replace(range, newLine))
        editCount++
        logger.debug(`  Line ${cd.line}: adding ${spacesToAdd} spaces`)
      }
    }

    logger.info(`  Group ${idx + 1}: generated ${editCount} edits`)
  })

  // ===== 4. 应用所有编辑 =====
  if (edits.length > 0) {
    logger.info(`Step 4: Applying ${edits.length} edits to document`)
    const workspaceEdit = new vscode.WorkspaceEdit()
    workspaceEdit.set(document.uri, edits)
    await vscode.workspace.applyEdit(workspaceEdit)
    logger.info(`  ✅ ${edits.length} edits applied successfully`)
  } else {
    logger.info('  ⏭️ No edits needed, document already aligned')
  }
}
