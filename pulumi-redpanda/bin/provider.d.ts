import * as pulumi from "@pulumi/pulumi";
/**
 * The provider type for the redpanda package. By default, resources use package-wide configuration
 * settings, however an explicit `Provider` instance may be created and passed during resource
 * construction to achieve fine-grained programmatic control over provider settings. See the
 * [documentation](https://www.pulumi.com/docs/reference/programming-model/#providers) for more information.
 */
export declare class Provider extends pulumi.ProviderResource {
    /**
     * Returns true if the given object is an instance of Provider.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is Provider;
    /**
     * Redpanda client token. You need either <span pulumi-lang-nodejs="`accessToken`" pulumi-lang-dotnet="`AccessToken`" pulumi-lang-go="`accessToken`" pulumi-lang-python="`access_token`" pulumi-lang-yaml="`accessToken`" pulumi-lang-java="`accessToken`">`access_token`</span>, or both <span pulumi-lang-nodejs="`clientId`" pulumi-lang-dotnet="`ClientId`" pulumi-lang-go="`clientId`" pulumi-lang-python="`client_id`" pulumi-lang-yaml="`clientId`" pulumi-lang-java="`clientId`">`client_id`</span> and <span pulumi-lang-nodejs="`clientSecret`" pulumi-lang-dotnet="`ClientSecret`" pulumi-lang-go="`clientSecret`" pulumi-lang-python="`client_secret`" pulumi-lang-yaml="`clientSecret`" pulumi-lang-java="`clientSecret`">`client_secret`</span> to use this provider. Can also be set with the `REDPANDA_ACCESS_TOKEN` environment variable.
     */
    readonly accessToken: pulumi.Output<string | undefined>;
    /**
     * AWS access key ID for BYOC clusters. Can also be set via AWS_ACCESS_KEY_ID.
     */
    readonly awsAccessKeyId: pulumi.Output<string | undefined>;
    /**
     * AWS secret access key for BYOC clusters. Can also be set via AWS_SECRET_ACCESS_KEY.
     */
    readonly awsSecretAccessKey: pulumi.Output<string | undefined>;
    /**
     * AWS session token for BYOC clusters (for temporary credentials). Can also be set via AWS_SESSION_TOKEN.
     */
    readonly awsSessionToken: pulumi.Output<string | undefined>;
    /**
     * Used for creating and managing BYOC and BYOVPC clusters. Can also be specified in the environment as AZURE_CLIENT_ID or ARM_CLIENT_ID
     */
    readonly azureClientId: pulumi.Output<string | undefined>;
    /**
     * Used for creating and managing BYOC and BYOVPC clusters. Can also be specified in the environment as AZURE_CLIENT_SECRET or ARM_CLIENT_SECRET
     */
    readonly azureClientSecret: pulumi.Output<string | undefined>;
    /**
     * The default Azure Subscription ID which should be used for Redpanda BYOC clusters. If another subscription is specified on a resource, it will take precedence. This can also be sourced from the `ARM_SUBSCRIPTION_ID` environment variable.
     */
    readonly azureSubscriptionId: pulumi.Output<string | undefined>;
    /**
     * Used for creating and managing BYOC and BYOVPC clusters. Can also be specified in the environment as AZURE_TENANT_ID or ARM_TENANT_ID
     */
    readonly azureTenantId: pulumi.Output<string | undefined>;
    /**
     * The ID for the client. You need either <span pulumi-lang-nodejs="`clientId`" pulumi-lang-dotnet="`ClientId`" pulumi-lang-go="`clientId`" pulumi-lang-python="`client_id`" pulumi-lang-yaml="`clientId`" pulumi-lang-java="`clientId`">`client_id`</span> AND <span pulumi-lang-nodejs="`clientSecret`" pulumi-lang-dotnet="`ClientSecret`" pulumi-lang-go="`clientSecret`" pulumi-lang-python="`client_secret`" pulumi-lang-yaml="`clientSecret`" pulumi-lang-java="`clientSecret`">`client_secret`</span>, or <span pulumi-lang-nodejs="`accessToken`" pulumi-lang-dotnet="`AccessToken`" pulumi-lang-go="`accessToken`" pulumi-lang-python="`access_token`" pulumi-lang-yaml="`accessToken`" pulumi-lang-java="`accessToken`">`access_token`</span>, to use this provider. Can also be set with the `REDPANDA_CLIENT_ID` environment variable.
     */
    readonly clientId: pulumi.Output<string | undefined>;
    /**
     * Redpanda client secret. You need either <span pulumi-lang-nodejs="`clientId`" pulumi-lang-dotnet="`ClientId`" pulumi-lang-go="`clientId`" pulumi-lang-python="`client_id`" pulumi-lang-yaml="`clientId`" pulumi-lang-java="`clientId`">`client_id`</span> AND <span pulumi-lang-nodejs="`clientSecret`" pulumi-lang-dotnet="`ClientSecret`" pulumi-lang-go="`clientSecret`" pulumi-lang-python="`client_secret`" pulumi-lang-yaml="`clientSecret`" pulumi-lang-java="`clientSecret`">`client_secret`</span>, or <span pulumi-lang-nodejs="`accessToken`" pulumi-lang-dotnet="`AccessToken`" pulumi-lang-go="`accessToken`" pulumi-lang-python="`access_token`" pulumi-lang-yaml="`accessToken`" pulumi-lang-java="`accessToken`">`access_token`</span>, to use this provider. Can also be set with the `REDPANDA_CLIENT_SECRET` environment variable.
     */
    readonly clientSecret: pulumi.Output<string | undefined>;
    /**
     * The default Google Cloud Project ID to use for Redpanda BYOC clusters. If another project is specified on a resource, it will take precedence. This can also be sourced from the `GOOGLE_PROJECT` environment variable, or any of the following ordered by precedence: `GOOGLE_PROJECT`, `GOOGLE_CLOUD_PROJECT`, `GCLOUD_PROJECT`, or `CLOUDSDK_CORE_PROJECT`.
     */
    readonly gcpProjectId: pulumi.Output<string | undefined>;
    /**
     * Used for creating and managing BYOC and BYOVPC clusters. Can also be specified in the environment as GOOGLE_CREDENTIALS
     */
    readonly googleCredentials: pulumi.Output<string | undefined>;
    /**
     * Used for creating and managing BYOC and BYOVPC clusters. Is a convenience passthrough for base64 encoded credentials intended for use in CI/CD. Can also be specified in the environment as GOOGLE_CREDENTIALS_BASE64
     */
    readonly googleCredentialsBase64: pulumi.Output<string | undefined>;
    /**
     * Create a Provider resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args?: ProviderArgs, opts?: pulumi.ResourceOptions);
    /**
     * This function returns a Terraform config object with terraform-namecased keys,to be used with the Terraform Module Provider.
     */
    terraformConfig(): pulumi.Output<{
        [key: string]: any;
    }>;
}
/**
 * The set of arguments for constructing a Provider resource.
 */
export interface ProviderArgs {
    /**
     * Redpanda client token. You need either <span pulumi-lang-nodejs="`accessToken`" pulumi-lang-dotnet="`AccessToken`" pulumi-lang-go="`accessToken`" pulumi-lang-python="`access_token`" pulumi-lang-yaml="`accessToken`" pulumi-lang-java="`accessToken`">`access_token`</span>, or both <span pulumi-lang-nodejs="`clientId`" pulumi-lang-dotnet="`ClientId`" pulumi-lang-go="`clientId`" pulumi-lang-python="`client_id`" pulumi-lang-yaml="`clientId`" pulumi-lang-java="`clientId`">`client_id`</span> and <span pulumi-lang-nodejs="`clientSecret`" pulumi-lang-dotnet="`ClientSecret`" pulumi-lang-go="`clientSecret`" pulumi-lang-python="`client_secret`" pulumi-lang-yaml="`clientSecret`" pulumi-lang-java="`clientSecret`">`client_secret`</span> to use this provider. Can also be set with the `REDPANDA_ACCESS_TOKEN` environment variable.
     */
    accessToken?: pulumi.Input<string>;
    /**
     * AWS access key ID for BYOC clusters. Can also be set via AWS_ACCESS_KEY_ID.
     */
    awsAccessKeyId?: pulumi.Input<string>;
    /**
     * AWS secret access key for BYOC clusters. Can also be set via AWS_SECRET_ACCESS_KEY.
     */
    awsSecretAccessKey?: pulumi.Input<string>;
    /**
     * AWS session token for BYOC clusters (for temporary credentials). Can also be set via AWS_SESSION_TOKEN.
     */
    awsSessionToken?: pulumi.Input<string>;
    /**
     * Used for creating and managing BYOC and BYOVPC clusters. Can also be specified in the environment as AZURE_CLIENT_ID or ARM_CLIENT_ID
     */
    azureClientId?: pulumi.Input<string>;
    /**
     * Used for creating and managing BYOC and BYOVPC clusters. Can also be specified in the environment as AZURE_CLIENT_SECRET or ARM_CLIENT_SECRET
     */
    azureClientSecret?: pulumi.Input<string>;
    /**
     * The default Azure Subscription ID which should be used for Redpanda BYOC clusters. If another subscription is specified on a resource, it will take precedence. This can also be sourced from the `ARM_SUBSCRIPTION_ID` environment variable.
     */
    azureSubscriptionId?: pulumi.Input<string>;
    /**
     * Used for creating and managing BYOC and BYOVPC clusters. Can also be specified in the environment as AZURE_TENANT_ID or ARM_TENANT_ID
     */
    azureTenantId?: pulumi.Input<string>;
    /**
     * The ID for the client. You need either <span pulumi-lang-nodejs="`clientId`" pulumi-lang-dotnet="`ClientId`" pulumi-lang-go="`clientId`" pulumi-lang-python="`client_id`" pulumi-lang-yaml="`clientId`" pulumi-lang-java="`clientId`">`client_id`</span> AND <span pulumi-lang-nodejs="`clientSecret`" pulumi-lang-dotnet="`ClientSecret`" pulumi-lang-go="`clientSecret`" pulumi-lang-python="`client_secret`" pulumi-lang-yaml="`clientSecret`" pulumi-lang-java="`clientSecret`">`client_secret`</span>, or <span pulumi-lang-nodejs="`accessToken`" pulumi-lang-dotnet="`AccessToken`" pulumi-lang-go="`accessToken`" pulumi-lang-python="`access_token`" pulumi-lang-yaml="`accessToken`" pulumi-lang-java="`accessToken`">`access_token`</span>, to use this provider. Can also be set with the `REDPANDA_CLIENT_ID` environment variable.
     */
    clientId?: pulumi.Input<string>;
    /**
     * Redpanda client secret. You need either <span pulumi-lang-nodejs="`clientId`" pulumi-lang-dotnet="`ClientId`" pulumi-lang-go="`clientId`" pulumi-lang-python="`client_id`" pulumi-lang-yaml="`clientId`" pulumi-lang-java="`clientId`">`client_id`</span> AND <span pulumi-lang-nodejs="`clientSecret`" pulumi-lang-dotnet="`ClientSecret`" pulumi-lang-go="`clientSecret`" pulumi-lang-python="`client_secret`" pulumi-lang-yaml="`clientSecret`" pulumi-lang-java="`clientSecret`">`client_secret`</span>, or <span pulumi-lang-nodejs="`accessToken`" pulumi-lang-dotnet="`AccessToken`" pulumi-lang-go="`accessToken`" pulumi-lang-python="`access_token`" pulumi-lang-yaml="`accessToken`" pulumi-lang-java="`accessToken`">`access_token`</span>, to use this provider. Can also be set with the `REDPANDA_CLIENT_SECRET` environment variable.
     */
    clientSecret?: pulumi.Input<string>;
    /**
     * The default Google Cloud Project ID to use for Redpanda BYOC clusters. If another project is specified on a resource, it will take precedence. This can also be sourced from the `GOOGLE_PROJECT` environment variable, or any of the following ordered by precedence: `GOOGLE_PROJECT`, `GOOGLE_CLOUD_PROJECT`, `GCLOUD_PROJECT`, or `CLOUDSDK_CORE_PROJECT`.
     */
    gcpProjectId?: pulumi.Input<string>;
    /**
     * Used for creating and managing BYOC and BYOVPC clusters. Can also be specified in the environment as GOOGLE_CREDENTIALS
     */
    googleCredentials?: pulumi.Input<string>;
    /**
     * Used for creating and managing BYOC and BYOVPC clusters. Is a convenience passthrough for base64 encoded credentials intended for use in CI/CD. Can also be specified in the environment as GOOGLE_CREDENTIALS_BASE64
     */
    googleCredentialsBase64?: pulumi.Input<string>;
}
export declare namespace Provider {
    /**
     * The results of the Provider.terraformConfig method.
     */
    interface TerraformConfigResult {
        readonly result: {
            [key: string]: any;
        };
    }
}
