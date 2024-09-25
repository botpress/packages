import { Instrumentation, registerInstrumentations } from '@opentelemetry/instrumentation'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { JaegerPropagator } from '@opentelemetry/propagator-jaeger'
import { defaultServiceName, Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'
import { JaegerExporter } from '@opentelemetry/exporter-jaeger'

export const isEnabled = () => process.env.TRACING_ENABLED === 'true'

const isDebugEnabled = (enabled?: boolean) => (enabled !== undefined ? enabled : process.env.TRACING_DEBUG === 'true')

const removeUndefinedValues = <T>(obj: Record<string, T | undefined>): Record<string, T> => {
  const result: Record<string, T> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      result[key] = value
    }
  }

  return result
}

let initialized = false

export const isInitialized = () => initialized

type InitProps = {
  debug?: boolean
  environment?: string
  serviceName?: string
  serviceNamespace?: string
  serviceVersion?: string
  serviceInstanceId?: string
  /**
   * @default [getNodeAutoInstrumentations()]
   */
  instrumentations?: Instrumentation[]
}

/**
 * Warning: This function must be called synchronously at the start of the application.
 * Since it creates hooks in other packages, it must be executed before any other imports.
 */
export const init = ({
  debug,
  environment,
  serviceName,
  serviceNamespace,
  serviceVersion,
  serviceInstanceId,
  instrumentations
}: InitProps = {}) => {
  if (!isEnabled() || initialized) {
    return
  }

  if (isDebugEnabled(debug)) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG)
  }

  const propagator = new JaegerPropagator()
  const exporter = new JaegerExporter()
  const processor = new BatchSpanProcessor(exporter)

  const resourceAttributes = removeUndefinedValues({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName ?? process.env.OTEL_SERVICE_NAME ?? defaultServiceName(),
    [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion ?? process.env.OTEL_SERVICE_VERSION,
    [SemanticResourceAttributes.SERVICE_INSTANCE_ID]: serviceInstanceId ?? process.env.OTEL_SERVICE_VERSION_INSTANCE_ID,
    [SemanticResourceAttributes.SERVICE_NAMESPACE]: serviceNamespace ?? process.env.OTEL_SERVICE_NAMESPACE,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment ?? process.env.OTEL_DEPLOYMENT_ENVIRONMENT
  })

  const provider = new NodeTracerProvider({
    resource: new Resource(resourceAttributes)
  })

  provider.addSpanProcessor(processor)
  provider.register({ propagator })

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: instrumentations ?? [getNodeAutoInstrumentations()]
  })

  initialized = true
}
