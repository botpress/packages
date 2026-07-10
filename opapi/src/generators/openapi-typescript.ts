import openapiTS, { astToString, OpenAPI3 } from 'openapi-typescript'
import ts from 'typescript'

const removeUndefinedFromUnion = (type: ts.UnionTypeNode) => {
  const hasUndefined = type.types.some(
    (member) => member.kind === ts.SyntaxKind.UndefinedKeyword
  )

  if (!hasUndefined) return type

  return ts.factory.createUnionTypeNode(
    type.types.filter(
      member => member.kind !== ts.SyntaxKind.UndefinedKeyword
    )
  )
}

export const generateOpenapiTypescript = async (openapiSpec: OpenAPI3) => {
  const ast = await openapiTS(openapiSpec, {
    defaultNonNullable: true,
    exportType: true,
    postTransform(type) {
      if (!ts.isUnionTypeNode(type)) return type
      return removeUndefinedFromUnion(type)
    },
  })

  return astToString(ast)
}
