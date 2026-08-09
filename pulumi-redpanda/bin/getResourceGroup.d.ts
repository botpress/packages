import * as pulumi from "@pulumi/pulumi";
export declare function getResourceGroup(args?: GetResourceGroupArgs, opts?: pulumi.InvokeOptions): Promise<GetResourceGroupResult>;
/**
 * A collection of arguments for invoking getResourceGroup.
 */
export interface GetResourceGroupArgs {
    id?: string;
    name?: string;
}
/**
 * A collection of values returned by getResourceGroup.
 */
export interface GetResourceGroupResult {
    readonly id: string;
    readonly name: string;
}
export declare function getResourceGroupOutput(args?: GetResourceGroupOutputArgs, opts?: pulumi.InvokeOutputOptions): pulumi.Output<GetResourceGroupResult>;
/**
 * A collection of arguments for invoking getResourceGroup.
 */
export interface GetResourceGroupOutputArgs {
    id?: pulumi.Input<string>;
    name?: pulumi.Input<string>;
}
