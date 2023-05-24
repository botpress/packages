import * as pkg from '../../pkg'
import { ListEntityExtraction, ListEntityModel } from './typings'

export const extractForListModel = (strTokens: string[], listModel: ListEntityModel): ListEntityExtraction[] => {
  return pkg.extract(strTokens, listModel)
}
