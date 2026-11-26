import fs from 'fs'
import { describe, expect, it } from 'vitest'
import { join, basename } from 'path'
import { exportJsonSchemas, exportZodSchemas } from '../src'
import { validateTypescriptFile } from './util'
import { getFiles } from '../src/file'
import { z } from 'zod'

const schemaFiles = ['index.ts', 'user.j.ts', 'user.z.ts', 'user.t.ts', 'ticket.j.ts', 'ticket.z.ts', 'ticket.t.ts']

const assert = async (genFolder: string, exporter: (outDir: string) => Promise<void>) => {
  await exporter(genFolder)

  schemaFiles.forEach((file) => {
    const filename = join(genFolder, file)
    expect(fs.existsSync(filename), `${filename} should exist`).toBe(true)

    if (filename.endsWith('.ts')) {
      validateTypescriptFile(filename)
    }

    if (filename.endsWith('.z.ts')) {
      const fileContent = fs.readFileSync(filename, 'utf-8')
      expect(fileContent).not.toContain('.any()') // there's no reason to use .any() in the provided schemas
    }
  })

  const files = new Set(getFiles(genFolder).map((f) => basename(f)))
  expect(files).toEqual(new Set(schemaFiles))
}

describe('schemas generator', () => {
  it('should be able to export arbitrary json schemas', async () => {
    const genFolder = join(__dirname, 'gen/json-schemas')
    await assert(
      genFolder,
      exportJsonSchemas({
        user: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
            id: {
              anyOf: [
                {
                  type: 'string',
                },
                {
                  type: 'number',
                },
              ],
            },
          },
          required: ['name'],
        },
        ticket: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
          },
          required: ['title'],
        },
      }),
    )
  })

  it('should be able to export arbitrary zod schemas', async () => {
    const genFolder = join(__dirname, 'gen/zod-schemas')
    await assert(
      genFolder,
      exportZodSchemas({
        user: z.object({
          name: z.string(),
          age: z.number().optional(),
          id: z.union([z.string(), z.number()]),
        }),
        ticket: z.object({
          title: z.string(),
          content: z.string().optional(),
        }),
      }),
    )
  })
})

describe.concurrent(exportJsonSchemas, () => {
  it('generates zod code that accepts unknown keys and keeps strings mentioning .strict() as written', async ({
    expect,
  }) => {
    // Arrange
    const genFolder = join(__dirname, 'gen/unknown-keys')
    const exportSchemas = exportJsonSchemas({
      order: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['object.strict()'], description: 'Calls .strict() on the order' },
        },
        required: ['status'],
        additionalProperties: false,
      },
    })

    // Act
    await exportSchemas(genFolder)

    // Assert
    const { default: orderSchema } = await import(join(genFolder, 'order.z.ts'))
    expect(orderSchema.safeParse({ status: 'object.strict()', giftWrapped: true })).toMatchObject({
      success: true,
      data: { status: 'object.strict()' },
    })
    expect(orderSchema.shape.status.description).toBe('Calls .strict() on the order')
  })

  it('generates zod code that accepts unknown keys in nested objects', async ({ expect }) => {
    // Arrange
    const genFolder = join(__dirname, 'gen/nested-unknown-keys')
    const closedAddress = {
      type: 'object',
      properties: { city: { type: 'string' } },
      additionalProperties: false,
    } as const
    const exportSchemas = exportJsonSchemas({
      customer: {
        type: 'object',
        properties: {
          billingAddress: { type: ['object', 'null'], properties: { address: closedAddress } },
          addressesByLabel: { type: 'object', patternProperties: { '^home': closedAddress } },
          shippingAddress: { anyOf: [closedAddress, { type: 'null' }] },
        },
        additionalProperties: false,
      },
    })

    // Act
    await exportSchemas(genFolder)

    // Assert
    const { default: customerSchema } = await import(join(genFolder, 'customer.z.ts'))
    const addressWithUnknownKey = { city: 'Quebec', doorCode: '1234' }
    expect(
      customerSchema.safeParse({
        billingAddress: { address: addressWithUnknownKey },
        addressesByLabel: { homeMain: addressWithUnknownKey },
        shippingAddress: addressWithUnknownKey,
        loyaltyTier: 'gold',
      }),
    ).toMatchObject({ success: true })
  })
})
