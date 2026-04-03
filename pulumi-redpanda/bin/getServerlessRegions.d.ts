import * as pulumi from "@pulumi/pulumi";
import * as outputs from "./types/output";
export declare function getServerlessRegions(args: GetServerlessRegionsArgs, opts?: pulumi.InvokeOptions): Promise<GetServerlessRegionsResult>;
/**
 * A collection of arguments for invoking getServerlessRegions.
 */
export interface GetServerlessRegionsArgs {
    cloudProvider: string;
}
/**
 * A collection of values returned by getServerlessRegions.
 */
export interface GetServerlessRegionsResult {
    readonly cloudProvider: string;
    /**
     * The provider-assigned unique ID for this managed resource.
     */
    readonly id: string;
    readonly serverlessRegions: outputs.GetServerlessRegionsServerlessRegion[];
}
export declare function getServerlessRegionsOutput(args: GetServerlessRegionsOutputArgs, opts?: pulumi.InvokeOutputOptions): pulumi.Output<GetServerlessRegionsResult>;
/**
 * A collection of arguments for invoking getServerlessRegions.
 */
export interface GetServerlessRegionsOutputArgs {
    cloudProvider: pulumi.Input<string>;
}
