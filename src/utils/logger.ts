import * as vscode from 'vscode'
import { channelName } from './nameManager'

/**
 * 日志级别
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

/**
 * 日志管理器（单例）
 */
class Logger {
  private static instance: Logger
  private channel: vscode.OutputChannel | undefined

  constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  /**
   * 初始化日志通道
   */
  initialize() {
    if (this.channel) return

    this.channel = vscode.window.createOutputChannel(channelName)
    this.info('═══════════════════════════════════════════════════')
    this.info('Logger initialized')
  }

  /**
   * 获取输出通道
   */
  getChannel(): vscode.OutputChannel {
    if (!this.channel) {
      this.initialize()
    }
    return this.channel!
  }

  /**
   * 显示日志面板
   */
  show(preserveFocus: boolean = false) {
    this.getChannel().show(preserveFocus)
  }

  /**
   * 隐藏日志面板
   */
  hide() {
    this.getChannel()?.hide()
  }

  /**
   * 清空日志
   */
  clear() {
    this.getChannel()?.clear()
  }

  /**
   * 释放资源
   */
  dispose() {
    if (this.channel) {
      this.channel.appendLine('───────────────────────────────────────────────────')
      this.info('Logger disposed')
      this.channel.appendLine('═══════════════════════════════════════════════════')
      this.channel.dispose()
      this.channel = undefined
    }
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toLocaleTimeString()
    const levelMap = {
      [LogLevel.ERROR]: 'ERROR ❌',
      [LogLevel.WARN]: 'WARN  ⚠️',
      [LogLevel.INFO]: 'INFO  ',
      [LogLevel.DEBUG]: 'DEBUG '
    }
    const prefix = levelMap[level] || 'INFO  '
    return `[${prefix} ${timestamp}] ${message}`
  }

  /**
   * 输出日志
   */
  private log(level: LogLevel, message: string, ...args: any[]) {
    const channel = this.getChannel()
    const formatted = this.formatMessage(level, message)
    channel.appendLine(formatted)

    if (args.length > 0) {
      channel.appendLine(`  └─ ${JSON.stringify(args, null, 2)}`)
    }
  }

  /**
   * 输出错误日志
   */
  error(message: string, error?: any) {
    const channel = this.getChannel()
    const formatted = this.formatMessage(LogLevel.ERROR, message)
    channel.appendLine(formatted)
    if (error) {
      channel.appendLine(`  └─ ${error.stack || error.message || JSON.stringify(error)}`)
    }
  }

  /**
   * 输出警告日志
   */
  warn(message: string, ...args: any[]) {
    this.log(LogLevel.WARN, message, ...args)
  }

  /**
   * 输出信息日志
   */
  info(message: string, ...args: any[]) {
    this.log(LogLevel.INFO, message, ...args)
  }

  /**
   * 输出调试日志
   */
  debug(message: string, ...args: any[]) {
    this.log(LogLevel.DEBUG, message, ...args)
  }

  /**
   * 分隔线
   */
  divider() {
    this.getChannel().appendLine('═══════════════════════════════════════════════════')
  }
}

/**
 * 便捷导出：默认使用单例
 */
export const logger = Logger.getInstance()
