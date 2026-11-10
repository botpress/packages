import * as pulumi from "@pulumi/pulumi";
export declare function getApiKeyId(args?: GetApiKeyIdArgs, opts?: pulumi.InvokeOptions): Promise<GetApiKeyIdResult>;
/**
 * A collection of arguments for invoking getApiKeyId.
 */
export interface GetApiKeyIdArgs {
    name?: string;
}
/**
 * A collection of values returned by getApiKeyId.
 */
export interface GetApiKeyIdResult {
    readonly id: string;
    readonly name: string;
}
export declare function getApiKeyIdOutput(args?: GetApiKeyIdOutputArgs, opts?: pulumi.InvokeOutputOptions): pulumi.Output<GetApiKeyIdResult>;
/**
 * A collection of arguments for invoking getApiKeyId.
 */
export interface GetApiKeyIdOutputArgs {
    name?: pulumi.Input<string>;
}
