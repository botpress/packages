import axios, { AxiosInstance } from 'axios'

type GripPublisherConfig = {
  /** Url that points to Pushpin (dev) or Pubchat (staging/prod) */
  signalUrl: string
}

export class GripPublisher {
  private _client: AxiosInstance
  public constructor(config: GripPublisherConfig) {
    this._client = axios.create({ baseURL: config.signalUrl })
  }

  publish(channels: string[], payload: string) {
    const id = Math.random().toString(16).slice(2)
    for (const channel of channels) {
      this._client.post('/publish', {
        channel: channel,
        id: id,
        formats: {
          'ws-message': {
            content: payload
          }
        }
      })
    }
  }
}
