import * as pulumi from "@pulumi/pulumi";
export declare function getPrivateEndpointConfig(args: GetPrivateEndpointConfigArgs, opts?: pulumi.InvokeOptions): Promise<GetPrivateEndpointConfigResult>;
/**
 * A collection of arguments for invoking getPrivateEndpointConfig.
 */
export interface GetPrivateEndpointConfigArgs {
    cloudProvider: string;
    region: string;
}
/**
 * A collection of values returned by getPrivateEndpointConfig.
 */
export interface GetPrivateEndpointConfigResult {
    readonly cloudProvider: string;
    readonly endpointServiceId: string;
    /**
     * The provider-assigned unique ID for this managed resource.
     */
    readonly id: string;
    readonly region: string;
}
export declare function getPrivateEndpointConfigOutput(args: GetPrivateEndpointConfigOutputArgs, opts?: pulumi.InvokeOutputOptions): pulumi.Output<GetPrivateEndpointConfigResult>;
/**
 * A collection of arguments for invoking getPrivateEndpointConfig.
 */
export interface GetPrivateEndpointConfigOutputArgs {
    cloudProvider: pulumi.Input<string>;
    region: pulumi.Input<string>;
}
