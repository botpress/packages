import {
  parseFunctionDefinition,
  parseParameterTypes,
  parseRequestParameterTypes,
  parseReturnTypes,
  parseSectionTypes,
} from './section-types-generator.parsers'
import { OperationParser, SectionParser } from './section-types-generator.types'

export const operationParsers: OperationParser[] = [
  parseFunctionDefinition,
  parseParameterTypes,
  parseRequestParameterTypes,
  parseReturnTypes,
]
export const sectionParsers: SectionParser[] = [parseSectionTypes]
