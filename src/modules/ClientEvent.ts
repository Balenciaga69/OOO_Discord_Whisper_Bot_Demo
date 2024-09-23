/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Client, Events, GatewayIntentBits } from 'discord.js'
import { MsgCreateEvents } from './MessageCreate'
import { token } from './token'

export const ClientEvent = async () => {
  const client = new Client({
    intents: [
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  })

  const msgEvt = new MsgCreateEvents()

  client.once(Events.ClientReady, (readyClient) => {
    console.info('ClientEvent-ClientReady', readyClient.user.tag)
  })

  client.on(Events.MessageCreate, (message) => {
    // Ignore messages sent by bots
    if (message.author.bot) return
    if (message.content === '熊男過來') void msgEvt.StartRecording(message)
    if (message.content === '熊男再見') msgEvt.StopRecording()
    if (message.content === '熊男做事') void msgEvt.DoThings(message)
    if (message.content === '熊男快說') void msgEvt.getConversations(message)
  })

  void client.login(token)
}
