import * as vscode from 'vscode'
import { logger } from './logger'
import { configSection } from './nameManager'

interface IConfig {
  /**
   * 注释缩进
   */
  commentIndentSize: number
}

// 默认值
const DEFAULT_CONFIG: IConfig = {
  commentIndentSize: 4
}

export class Config {
  private static instance: Config
  private currentConfig: IConfig = {
    ...DEFAULT_CONFIG
  }

  private configChangeListener: vscode.Disposable | undefined = undefined

  constructor() {
    logger.info('Loading config...')
    this.loadConfig()
    logger.info('Loaded config finished')
  }

  static getInstance(): Config {
    if (!this.instance) {
      this.instance = new Config()
    }
    return this.instance
  }

  private loadConfig() {
    const config = vscode.workspace.getConfiguration(configSection)

    const keys = Object.keys(DEFAULT_CONFIG) as (keyof IConfig)[]
    keys.forEach((key) => {
      const value = config.get<IConfig[typeof key]>(key, DEFAULT_CONFIG[key])
      // @ts-ignore: 忽略类型检查
      this.currentConfig[key] = value
    })
  }

  /**
   * 获取单个配置项
   */
  public get<T>(key: keyof IConfig): T {
    return this.currentConfig[key] as T
  }

  /**
   * 初始化配置监听
   */
  public initialize() {
    if (this.configChangeListener) return

    // 监听配置变更
    this.configChangeListener = vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(configSection)) {
        logger.info('Config changed, reloading...')
        this.loadConfig()
        logger.info('Config reloaded')
      }
    })
  }

  /**
   * 销毁配置监听
   */
  public dispose() {
    if (this.configChangeListener) {
      this.configChangeListener.dispose()
      this.configChangeListener = undefined
    }
  }
}

export const config = Config.getInstance()
