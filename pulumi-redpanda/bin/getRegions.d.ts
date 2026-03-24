import * as pulumi from "@pulumi/pulumi";
import * as outputs from "./types/output";
export declare function getRegions(args: GetRegionsArgs, opts?: pulumi.InvokeOptions): Promise<GetRegionsResult>;
/**
 * A collection of arguments for invoking getRegions.
 */
export interface GetRegionsArgs {
    cloudProvider: string;
}
/**
 * A collection of values returned by getRegions.
 */
export interface GetRegionsResult {
    readonly cloudProvider: string;
    /**
     * The provider-assigned unique ID for this managed resource.
     */
    readonly id: string;
    readonly regions: outputs.GetRegionsRegion[];
}
export declare function getRegionsOutput(args: GetRegionsOutputArgs, opts?: pulumi.InvokeOutputOptions): pulumi.Output<GetRegionsResult>;
/**
 * A collection of arguments for invoking getRegions.
 */
export interface GetRegionsOutputArgs {
    cloudProvider: pulumi.Input<string>;
}
