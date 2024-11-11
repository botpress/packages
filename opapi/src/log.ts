import winston from 'winston'

const customFormat = winston.format.printf(({ message }) => {
  return message as string
})

export type Logger = {
  debug(message: string, metadata?: any): void
  info(message: string, metadata?: any): void
  warn(message: string, metadata?: any): void
  error(message: string, metadata?: any): void
}

const logger: Logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.colorize(), winston.format.splat(), customFormat),
  transports: [new winston.transports.Console({})],
})

export default logger
