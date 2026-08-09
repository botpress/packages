import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare function getCluster(args: GetClusterArgs, opts?: pulumi.InvokeOptions): Promise<GetClusterResult>;
/**
 * A collection of arguments for invoking getCluster.
 */
export interface GetClusterArgs {
    id: string;
    timeouts?: inputs.GetClusterTimeouts;
}
/**
 * A collection of values returned by getCluster.
 */
export interface GetClusterResult {
    readonly allowDeletion: boolean;
    readonly awsPrivateLink: outputs.GetClusterAwsPrivateLink;
    readonly azurePrivateLink: outputs.GetClusterAzurePrivateLink;
    readonly cloudProvider: string;
    readonly clusterApiUrl: string;
    readonly clusterConfiguration: outputs.GetClusterClusterConfiguration;
    readonly clusterType: string;
    readonly connectionType: string;
    readonly createdAt: string;
    readonly customerManagedResources: outputs.GetClusterCustomerManagedResources;
    readonly gcpGlobalAccessEnabled: boolean;
    readonly gcpPrivateServiceConnect: outputs.GetClusterGcpPrivateServiceConnect;
    readonly httpProxy: outputs.GetClusterHttpProxy;
    readonly id: string;
    readonly kafkaApi: outputs.GetClusterKafkaApi;
    readonly kafkaConnect: outputs.GetClusterKafkaConnect;
    readonly maintenanceWindowConfig: outputs.GetClusterMaintenanceWindowConfig;
    readonly name: string;
    readonly networkId: string;
    readonly prometheus: outputs.GetClusterPrometheus;
    readonly readReplicaClusterIds: string[];
    readonly redpandaConsole: outputs.GetClusterRedpandaConsole;
    readonly redpandaVersion: string;
    readonly region: string;
    readonly resourceGroupId: string;
    readonly schemaRegistry: outputs.GetClusterSchemaRegistry;
    readonly state: string;
    readonly stateDescription: outputs.GetClusterStateDescription;
    readonly tags: {
        [key: string]: string;
    };
    readonly throughputTier: string;
    readonly timeouts?: outputs.GetClusterTimeouts;
    readonly zones: string[];
}
export declare function getClusterOutput(args: GetClusterOutputArgs, opts?: pulumi.InvokeOutputOptions): pulumi.Output<GetClusterResult>;
/**
 * A collection of arguments for invoking getCluster.
 */
export interface GetClusterOutputArgs {
    id: pulumi.Input<string>;
    timeouts?: pulumi.Input<inputs.GetClusterTimeoutsArgs>;
}
