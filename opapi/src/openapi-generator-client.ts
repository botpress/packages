import axios from 'axios'

export function OpenapiGeneratorClient(endpoint: string) {
  return {
    generateClient: (spec: any, options: any) =>
      axios
        .post(`${endpoint}/api/gen/clients/typescript-axios`, { spec, options })
        .then(({ data }) => data.code as string),
    downloadClient: async (id: string) => {
      const response = await axios.get(`${endpoint}/api/gen/download/${id}`, { responseType: 'stream' })

      const chunks = []

      for await (const chunk of response.data) {
        chunks.push(chunk)
      }

      const data = Buffer.concat(chunks)

      return data
    },
  }
}
