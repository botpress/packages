import * as pulumi from "@pulumi/pulumi";
export declare function getServerlessCluster(args: GetServerlessClusterArgs, opts?: pulumi.InvokeOptions): Promise<GetServerlessClusterResult>;
/**
 * A collection of arguments for invoking getServerlessCluster.
 */
export interface GetServerlessClusterArgs {
    id: string;
}
/**
 * A collection of values returned by getServerlessCluster.
 */
export interface GetServerlessClusterResult {
    readonly clusterApiUrl: string;
    readonly id: string;
    readonly name: string;
    readonly resourceGroupId: string;
    readonly serverlessRegion: string;
}
export declare function getServerlessClusterOutput(args: GetServerlessClusterOutputArgs, opts?: pulumi.InvokeOutputOptions): pulumi.Output<GetServerlessClusterResult>;
/**
 * A collection of arguments for invoking getServerlessCluster.
 */
export interface GetServerlessClusterOutputArgs {
    id: pulumi.Input<string>;
}
