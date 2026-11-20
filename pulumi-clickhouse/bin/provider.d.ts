import * as pulumi from "@pulumi/pulumi";
/**
 * The provider type for the clickhouse package. By default, resources use package-wide configuration
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
     * API URL of the ClickHouse OpenAPI the provider will interact with. Alternatively, can be configured using the `CLICKHOUSE_API_URL` environment variable. Only specify if you have a specific deployment of the ClickHouse OpenAPI you want to run against.
     */
    readonly apiUrl: pulumi.Output<string | undefined>;
    /**
     * ID of the organization the provider will create services under. Alternatively, can be configured using the `CLICKHOUSE_ORG_ID` environment variable.
     */
    readonly organizationId: pulumi.Output<string | undefined>;
    /**
     * Token key of the key/secret pair. Used to authenticate with OpenAPI. Alternatively, can be configured using the `CLICKHOUSE_TOKEN_KEY` environment variable.
     */
    readonly tokenKey: pulumi.Output<string | undefined>;
    /**
     * Token secret of the key/secret pair. Used to authenticate with OpenAPI. Alternatively, can be configured using the `CLICKHOUSE_TOKEN_SECRET` environment variable.
     */
    readonly tokenSecret: pulumi.Output<string | undefined>;
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
     * API URL of the ClickHouse OpenAPI the provider will interact with. Alternatively, can be configured using the `CLICKHOUSE_API_URL` environment variable. Only specify if you have a specific deployment of the ClickHouse OpenAPI you want to run against.
     */
    apiUrl?: pulumi.Input<string>;
    /**
     * ID of the organization the provider will create services under. Alternatively, can be configured using the `CLICKHOUSE_ORG_ID` environment variable.
     */
    organizationId?: pulumi.Input<string>;
    /**
     * Timeout in seconds for the HTTP client.
     */
    timeoutSeconds?: pulumi.Input<number>;
    /**
     * Token key of the key/secret pair. Used to authenticate with OpenAPI. Alternatively, can be configured using the `CLICKHOUSE_TOKEN_KEY` environment variable.
     */
    tokenKey?: pulumi.Input<string>;
    /**
     * Token secret of the key/secret pair. Used to authenticate with OpenAPI. Alternatively, can be configured using the `CLICKHOUSE_TOKEN_SECRET` environment variable.
     */
    tokenSecret?: pulumi.Input<string>;
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
