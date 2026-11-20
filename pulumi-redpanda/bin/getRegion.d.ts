import * as pulumi from "@pulumi/pulumi";
export declare function getRegion(args: GetRegionArgs, opts?: pulumi.InvokeOptions): Promise<GetRegionResult>;
/**
 * A collection of arguments for invoking getRegion.
 */
export interface GetRegionArgs {
    cloudProvider: string;
    name: string;
}
/**
 * A collection of values returned by getRegion.
 */
export interface GetRegionResult {
    readonly cloudProvider: string;
    /**
     * The provider-assigned unique ID for this managed resource.
     */
    readonly id: string;
    readonly name: string;
    readonly zones: string[];
}
export declare function getRegionOutput(args: GetRegionOutputArgs, opts?: pulumi.InvokeOutputOptions): pulumi.Output<GetRegionResult>;
/**
 * A collection of arguments for invoking getRegion.
 */
export interface GetRegionOutputArgs {
    cloudProvider: pulumi.Input<string>;
    name: pulumi.Input<string>;
}
