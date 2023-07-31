import {
  parseFunctionDefinition,
  parseParameterTypes,
  parseRequestParameterTypes,
  parseReturnTypes,
  parseSectionTypes,
} from './parsers'
import { OperationParser, SectionParser } from './types'

export const operationParsers: OperationParser[] = [
  parseFunctionDefinition,
  parseParameterTypes,
  parseRequestParameterTypes,
  parseReturnTypes,
]
export const sectionParsers: SectionParser[] = [parseSectionTypes]
