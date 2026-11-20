import * as pulumi from "@pulumi/pulumi";
import * as outputs from "./types/output";
export declare function getSchema(args: GetSchemaArgs, opts?: pulumi.InvokeOptions): Promise<GetSchemaResult>;
/**
 * A collection of arguments for invoking getSchema.
 */
export interface GetSchemaArgs {
    clusterId: string;
    subject: string;
    version?: number;
}
/**
 * A collection of values returned by getSchema.
 */
export interface GetSchemaResult {
    readonly clusterId: string;
    readonly id: number;
    readonly references: outputs.GetSchemaReference[];
    readonly schema: string;
    readonly schemaType: string;
    readonly subject: string;
    readonly version: number;
}
export declare function getSchemaOutput(args: GetSchemaOutputArgs, opts?: pulumi.InvokeOutputOptions): pulumi.Output<GetSchemaResult>;
/**
 * A collection of arguments for invoking getSchema.
 */
export interface GetSchemaOutputArgs {
    clusterId: pulumi.Input<string>;
    subject: pulumi.Input<string>;
    version?: pulumi.Input<number>;
}
