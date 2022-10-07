import express from 'express'
import request from 'supertest'
import z from 'zod'
import { JsonRouter } from './router'

const basicHandler = async (req, res, next) => res.send('ok')
const echoHandler = async (req, res, next) => res.send(req.body)

/** Simply adds a middleware to check that the middleware was really called */
const basicMw = async (req, res, next) => {
  res.header('x-mw-1', 'first')
  next()
}

const makeRouter = () => {
  const app = express()
  const router = new JsonRouter()
  app.use('/', router.inner)

  return { app, router }
}

describe('Basic usage', function () {
  it('Test with a single handlers', async () => {
    const { app, router } = makeRouter()
    router.get({ path: '/info' }, basicHandler)

    const response = await request(app).get('/info')
    expect(response.text).toBe('ok')
    expect(response.status).toEqual(200)
  })

  it('Test with two handlers', async () => {
    const handler1 = async (req, res, next) => {
      res.header('X-MW-1', 'first')
      next()
    }

    const { app, router } = makeRouter()
    router.get({ path: '/info' }, handler1, basicHandler)

    const response = await request(app).get('/info')

    expect(response.headers['x-mw-1']).toBe('first')
    expect(response.text).toBe('ok')
    expect(response.status).toEqual(200)
  })

  it('Returns a json payload', async () => {
    const handler1 = async (req, res, next) => {
      res.send({ success: true })
    }

    const { app, router } = makeRouter()
    router.get({ path: '/status' }, handler1)

    const response = await request(app).get('/status')
    expect(response.body.success).toBe(true)
  })

  it('Fails when a handler throws an error', async () => {
    const handler1 = async (req, res, next) => {
      next(new Error('Something went wrong'))
    }

    const { app, router } = makeRouter()
    router.get({ path: '/fails' }, handler1, basicHandler)

    const response = await request(app).get('/fails')
    expect(response.statusCode).toBe(500)
  })
})

describe('Basic validation - Input', function () {
  const zBody = z.object({
    query: z.string().min(3),
  })

  const { app, router } = makeRouter()
  router.get({ path: '/api', input: zBody }, basicMw, echoHandler)

  it('Success if the input respects the schema', async () => {
    const response = await request(app).get('/api').send({ query: 'test' })
    expect(response.status).toBe(200)
  })

  it('Fails if the input is invalid', async () => {
    const response = await request(app).get('/api').send({ query: 't' })
    expect(response.status).toBe(500)
  })

  it('Strip keys not defined in the schema', async () => {
    const response = await request(app).get('/api').send({ query: 'test', admin: true })
    expect(response.body).toStrictEqual({ query: 'test' })
  })
})
