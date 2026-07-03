import * as pulumi from "@pulumi/pulumi";
import * as outputs from "./types/output";
export declare function getNetwork(args: GetNetworkArgs, opts?: pulumi.InvokeOptions): Promise<GetNetworkResult>;
/**
 * A collection of arguments for invoking getNetwork.
 */
export interface GetNetworkArgs {
    id: string;
}
/**
 * A collection of values returned by getNetwork.
 */
export interface GetNetworkResult {
    readonly cidrBlock: string;
    readonly cloudProvider: string;
    readonly clusterType: string;
    readonly customerManagedResources: outputs.GetNetworkCustomerManagedResources;
    readonly id: string;
    readonly name: string;
    readonly region: string;
    readonly resourceGroupId: string;
    readonly state: string;
    readonly zones: string[];
}
export declare function getNetworkOutput(args: GetNetworkOutputArgs, opts?: pulumi.InvokeOutputOptions): pulumi.Output<GetNetworkResult>;
/**
 * A collection of arguments for invoking getNetwork.
 */
export interface GetNetworkOutputArgs {
    id: pulumi.Input<string>;
}
