import { exec } from 'child_process'
import dayjs from 'dayjs'
import * as fs from 'fs'
import { stat } from 'fs/promises'
import _ from 'lodash'
import path from 'path'
import { promisify } from 'util'

interface TxtInfo {
  userId: string
  context: string
  timestamp: string
}

export class PowerShellRunner {
  private readonly _dirPath: string

  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-useless-constructor
  constructor() {
    this._dirPath = 'C:/temp/'
  }

  /**
   * 執行 Whisper 指令。
   */
  public async executeWhisper() {
    console.info('xZx ', this.executeWhisper.name, '觸發')
    const language = 'Chinese'
    //  取得所有檔案
    const readdir = promisify(fs.readdir)
    const files = await readdir(this._dirPath)
    const allVoices = _.filter(files, (file) => /\.(mp3|wav|m4a)$/.test(file))
    const allVoiceDir = _.map(allVoices, (f) => this._dirPath + f)
    const sortedVoice = _.sortBy(allVoiceDir)
    const sortedVoiceString = _.join(sortedVoice, ' ')
    if (allVoices.length === 0) {
      console.error(' XzX 該資料夾沒有檔案')
      return
    }

    // 生成 whisper 指令
    const whisperCommand = `whisper ${sortedVoiceString} --output_dir ${this._dirPath} --output_format txt --language ${language} --model small --device cuda`

    process.env.PYTHONIOENCODING = 'utf-8'
    const startTime = dayjs()
    const execPromise = promisify(exec)
    await execPromise(whisperCommand)
    const endTime = dayjs()
    const timeDiff = endTime.diff(startTime, 'second')
    console.info('xZx ', this.executeWhisper.name, '執行完畢 共計', timeDiff, '秒')
  }

  /**
   * 將 PCM 文件轉換為 MP3 文件並刪除原始 PCM 文件。
   */
  public async convertPCM() {
    const readdir = promisify(fs.readdir)
    const unlink = promisify(fs.unlink)
    const files = await readdir(this._dirPath)
    const allPCM = _.filter(files, (file) => /\.(pcm)$/.test(file))
    const allPCMDir = _.map(allPCM, (f) => this._dirPath + f)
    console.info('xZx ', this.convertPCM.name, '共計', allPCMDir.length, '個檔案')
    for (const f of allPCMDir) {
      const fileStat = await stat(f)
      if (fileStat.size >= 200 * 1024) {
        const execPromise = promisify(exec)
        const command = `ffmpeg -f s16le -ar 48000 -ac 2 -i ${f} ${_.replace(f, '.pcm', '.mp3')}`
        console.info('xZx command', command)
        await execPromise(command)
      }
      await unlink(f)
    }
  }

  /**
   * 將Txt檔全部轉成JSON物件
   */
  public async txtToJson(): Promise<TxtInfo[]> {
    const result: TxtInfo[] = []
    const readdir = promisify(fs.readdir)
    const files = await readdir(this._dirPath)
    const allTxt = _.filter(files, (file) => /\.(txt)$/.test(file))
    const sortedTxt = _.sortBy(allTxt)
    for (const txtFileName of sortedTxt) {
      const infoArray = _.split(_.replace(txtFileName, '.txt', ''), '_')
      const [timestamp = '', userId = ''] = infoArray
      if (_.isEmpty(timestamp) || _.isEmpty(userId)) continue
      const filePath = `${this._dirPath}/${txtFileName}`
      const context = fs.readFileSync(filePath, 'utf-8')
      const txtInfo: TxtInfo = { timestamp, userId, context }
      result.push(txtInfo)
    }
    return result
  }

  /**
   * 刪除 超過 n 分鐘的所有檔案
   */
  public async deleteOldFiles(): Promise<void> {
    const DELETE_MINS = 30
    const readdir = promisify(fs.readdir)
    const stat = promisify(fs.stat)
    const unlink = promisify(fs.unlink)

    try {
      const files = await readdir(this._dirPath)
      const now = dayjs() // Current time
      for (const file of files) {
        const filePath = path.join(this._dirPath, file)
        const fileStat = await stat(filePath)

        const fileCreationTime = dayjs(fileStat.birthtimeMs)
        const ageInMinutes = now.diff(fileCreationTime, 'minute')

        if (ageInMinutes > DELETE_MINS) {
          await unlink(filePath)
          console.info(`Deleted file: ${file}`)
          console.info('xZx ', '刪除檔案', file, '超過時間', ageInMinutes)
        }
      }
    } catch (error) {
      console.error('Error deleting files:', error)
    }
  }
}
