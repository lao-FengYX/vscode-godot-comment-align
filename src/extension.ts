import * as vscode from 'vscode'
import { registerCommands } from './core/register'
import { config } from './utils/config'
import { logger } from './utils/logger'

export function activate(context: vscode.ExtensionContext) {
  // ===== 初始化日志 =====
  logger.initialize()
  config.initialize()
  // 显示日志面板
  logger.show()

  // ===== 注册命令 =====
  const command = registerCommands(context)

  context.subscriptions.push(command)
  context.subscriptions.push(logger)
  context.subscriptions.push(config)
}

export function deactivate() {
  logger.info('Godot Comment Align plugin deactivated')
}
