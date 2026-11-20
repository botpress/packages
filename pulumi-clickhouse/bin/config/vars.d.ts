/**
 * API URL of the ClickHouse OpenAPI the provider will interact with. Alternatively, can be configured using the `CLICKHOUSE_API_URL` environment variable. Only specify if you have a specific deployment of the ClickHouse OpenAPI you want to run against.
 */
export declare const apiUrl: string | undefined;
/**
 * ID of the organization the provider will create services under. Alternatively, can be configured using the `CLICKHOUSE_ORG_ID` environment variable.
 */
export declare const organizationId: string | undefined;
/**
 * Timeout in seconds for the HTTP client.
 */
export declare const timeoutSeconds: number | undefined;
/**
 * Token key of the key/secret pair. Used to authenticate with OpenAPI. Alternatively, can be configured using the `CLICKHOUSE_TOKEN_KEY` environment variable.
 */
export declare const tokenKey: string | undefined;
/**
 * Token secret of the key/secret pair. Used to authenticate with OpenAPI. Alternatively, can be configured using the `CLICKHOUSE_TOKEN_SECRET` environment variable.
 */
export declare const tokenSecret: string | undefined;
