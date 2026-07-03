import * as pulumi from "@pulumi/pulumi";
import * as outputs from "./types/output";
export declare function getThroughputTiers(args?: GetThroughputTiersArgs, opts?: pulumi.InvokeOptions): Promise<GetThroughputTiersResult>;
/**
 * A collection of arguments for invoking getThroughputTiers.
 */
export interface GetThroughputTiersArgs {
    cloudProvider?: string;
}
/**
 * A collection of values returned by getThroughputTiers.
 */
export interface GetThroughputTiersResult {
    readonly cloudProvider?: string;
    /**
     * The provider-assigned unique ID for this managed resource.
     */
    readonly id: string;
    readonly throughputTiers: outputs.GetThroughputTiersThroughputTier[];
}
export declare function getThroughputTiersOutput(args?: GetThroughputTiersOutputArgs, opts?: pulumi.InvokeOutputOptions): pulumi.Output<GetThroughputTiersResult>;
/**
 * A collection of arguments for invoking getThroughputTiers.
 */
export interface GetThroughputTiersOutputArgs {
    cloudProvider?: pulumi.Input<string>;
}
