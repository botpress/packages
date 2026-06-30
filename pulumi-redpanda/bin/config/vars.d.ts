/**
 * Redpanda client token. You need either <span pulumi-lang-nodejs="`accessToken`" pulumi-lang-dotnet="`AccessToken`" pulumi-lang-go="`accessToken`" pulumi-lang-python="`access_token`" pulumi-lang-yaml="`accessToken`" pulumi-lang-java="`accessToken`">`access_token`</span>, or both <span pulumi-lang-nodejs="`clientId`" pulumi-lang-dotnet="`ClientId`" pulumi-lang-go="`clientId`" pulumi-lang-python="`client_id`" pulumi-lang-yaml="`clientId`" pulumi-lang-java="`clientId`">`client_id`</span> and <span pulumi-lang-nodejs="`clientSecret`" pulumi-lang-dotnet="`ClientSecret`" pulumi-lang-go="`clientSecret`" pulumi-lang-python="`client_secret`" pulumi-lang-yaml="`clientSecret`" pulumi-lang-java="`clientSecret`">`client_secret`</span> to use this provider. Can also be set with the `REDPANDA_ACCESS_TOKEN` environment variable.
 */
export declare const accessToken: string | undefined;
/**
 * AWS access key ID for BYOC clusters. Can also be set via AWS_ACCESS_KEY_ID.
 */
export declare const awsAccessKeyId: string | undefined;
/**
 * AWS secret access key for BYOC clusters. Can also be set via AWS_SECRET_ACCESS_KEY.
 */
export declare const awsSecretAccessKey: string | undefined;
/**
 * AWS session token for BYOC clusters (for temporary credentials). Can also be set via AWS_SESSION_TOKEN.
 */
export declare const awsSessionToken: string | undefined;
/**
 * Used for creating and managing BYOC and BYOVPC clusters. Can also be specified in the environment as AZURE_CLIENT_ID or ARM_CLIENT_ID
 */
export declare const azureClientId: string | undefined;
/**
 * Used for creating and managing BYOC and BYOVPC clusters. Can also be specified in the environment as AZURE_CLIENT_SECRET or ARM_CLIENT_SECRET
 */
export declare const azureClientSecret: string | undefined;
/**
 * The default Azure Subscription ID which should be used for Redpanda BYOC clusters. If another subscription is specified on a resource, it will take precedence. This can also be sourced from the `ARM_SUBSCRIPTION_ID` environment variable.
 */
export declare const azureSubscriptionId: string | undefined;
/**
 * Used for creating and managing BYOC and BYOVPC clusters. Can also be specified in the environment as AZURE_TENANT_ID or ARM_TENANT_ID
 */
export declare const azureTenantId: string | undefined;
/**
 * The ID for the client. You need either <span pulumi-lang-nodejs="`clientId`" pulumi-lang-dotnet="`ClientId`" pulumi-lang-go="`clientId`" pulumi-lang-python="`client_id`" pulumi-lang-yaml="`clientId`" pulumi-lang-java="`clientId`">`client_id`</span> AND <span pulumi-lang-nodejs="`clientSecret`" pulumi-lang-dotnet="`ClientSecret`" pulumi-lang-go="`clientSecret`" pulumi-lang-python="`client_secret`" pulumi-lang-yaml="`clientSecret`" pulumi-lang-java="`clientSecret`">`client_secret`</span>, or <span pulumi-lang-nodejs="`accessToken`" pulumi-lang-dotnet="`AccessToken`" pulumi-lang-go="`accessToken`" pulumi-lang-python="`access_token`" pulumi-lang-yaml="`accessToken`" pulumi-lang-java="`accessToken`">`access_token`</span>, to use this provider. Can also be set with the `REDPANDA_CLIENT_ID` environment variable.
 */
export declare const clientId: string | undefined;
/**
 * Redpanda client secret. You need either <span pulumi-lang-nodejs="`clientId`" pulumi-lang-dotnet="`ClientId`" pulumi-lang-go="`clientId`" pulumi-lang-python="`client_id`" pulumi-lang-yaml="`clientId`" pulumi-lang-java="`clientId`">`client_id`</span> AND <span pulumi-lang-nodejs="`clientSecret`" pulumi-lang-dotnet="`ClientSecret`" pulumi-lang-go="`clientSecret`" pulumi-lang-python="`client_secret`" pulumi-lang-yaml="`clientSecret`" pulumi-lang-java="`clientSecret`">`client_secret`</span>, or <span pulumi-lang-nodejs="`accessToken`" pulumi-lang-dotnet="`AccessToken`" pulumi-lang-go="`accessToken`" pulumi-lang-python="`access_token`" pulumi-lang-yaml="`accessToken`" pulumi-lang-java="`accessToken`">`access_token`</span>, to use this provider. Can also be set with the `REDPANDA_CLIENT_SECRET` environment variable.
 */
export declare const clientSecret: string | undefined;
/**
 * The default Google Cloud Project ID to use for Redpanda BYOC clusters. If another project is specified on a resource, it will take precedence. This can also be sourced from the `GOOGLE_PROJECT` environment variable, or any of the following ordered by precedence: `GOOGLE_PROJECT`, `GOOGLE_CLOUD_PROJECT`, `GCLOUD_PROJECT`, or `CLOUDSDK_CORE_PROJECT`.
 */
export declare const gcpProjectId: string | undefined;
/**
 * Used for creating and managing BYOC and BYOVPC clusters. Can also be specified in the environment as GOOGLE_CREDENTIALS
 */
export declare const googleCredentials: string | undefined;
/**
 * Used for creating and managing BYOC and BYOVPC clusters. Is a convenience passthrough for base64 encoded credentials intended for use in CI/CD. Can also be specified in the environment as GOOGLE_CREDENTIALS_BASE64
 */
export declare const googleCredentialsBase64: string | undefined;
