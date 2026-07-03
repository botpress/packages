import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class ServerlessCluster extends pulumi.CustomResource {
    /**
     * Get an existing ServerlessCluster resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param state Any extra arguments used during the lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    static get(name: string, id: pulumi.Input<pulumi.ID>, state?: ServerlessClusterState, opts?: pulumi.CustomResourceOptions): ServerlessCluster;
    /**
     * Returns true if the given object is an instance of ServerlessCluster.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is ServerlessCluster;
    /**
     * The URL of the dataplane API for the serverless cluster
     *
     * @deprecated Deprecated
     */
    readonly clusterApiUrl: pulumi.Output<string>;
    /**
     * Private Console URL for the serverless cluster
     */
    readonly consolePrivateUrl: pulumi.Output<string>;
    /**
     * Public Console URL for the serverless cluster
     */
    readonly consoleUrl: pulumi.Output<string>;
    /**
     * Dataplane API endpoints for the serverless cluster
     */
    readonly dataplaneApi: pulumi.Output<outputs.ServerlessClusterDataplaneApi>;
    /**
     * Kafka API endpoints for the serverless cluster
     */
    readonly kafkaApi: pulumi.Output<outputs.ServerlessClusterKafkaApi>;
    /**
     * Name of the serverless cluster
     */
    readonly name: pulumi.Output<string>;
    /**
     * Network configuration controlling public/private access to the cluster
     */
    readonly networkingConfig: pulumi.Output<outputs.ServerlessClusterNetworkingConfig>;
    /**
     * Planned deletion information for the serverless cluster.
     */
    readonly plannedDeletion: pulumi.Output<outputs.ServerlessClusterPlannedDeletion>;
    /**
     * Private link ID for the serverless cluster. Must be set if private networking is enabled.
     */
    readonly privateLinkId: pulumi.Output<string>;
    /**
     * Prometheus metrics endpoints for the serverless cluster
     */
    readonly prometheus: pulumi.Output<outputs.ServerlessClusterPrometheus>;
    /**
     * The ID of the Resource Group in which to create the serverless cluster
     */
    readonly resourceGroupId: pulumi.Output<string>;
    /**
     * Schema Registry endpoints for the serverless cluster
     */
    readonly schemaRegistry: pulumi.Output<outputs.ServerlessClusterSchemaRegistry>;
    /**
     * Redpanda specific region of the serverless cluster
     */
    readonly serverlessRegion: pulumi.Output<string>;
    /**
     * Current state of the serverless cluster.
     */
    readonly state: pulumi.Output<string>;
    /**
     * Tags placed on cloud resources.
     */
    readonly tags: pulumi.Output<{
        [key: string]: string;
    } | undefined>;
    /**
     * Create a ServerlessCluster resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: ServerlessClusterArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering ServerlessCluster resources.
 */
export interface ServerlessClusterState {
    /**
     * The URL of the dataplane API for the serverless cluster
     *
     * @deprecated Deprecated
     */
    clusterApiUrl?: pulumi.Input<string>;
    /**
     * Private Console URL for the serverless cluster
     */
    consolePrivateUrl?: pulumi.Input<string>;
    /**
     * Public Console URL for the serverless cluster
     */
    consoleUrl?: pulumi.Input<string>;
    /**
     * Dataplane API endpoints for the serverless cluster
     */
    dataplaneApi?: pulumi.Input<inputs.ServerlessClusterDataplaneApi>;
    /**
     * Kafka API endpoints for the serverless cluster
     */
    kafkaApi?: pulumi.Input<inputs.ServerlessClusterKafkaApi>;
    /**
     * Name of the serverless cluster
     */
    name?: pulumi.Input<string>;
    /**
     * Network configuration controlling public/private access to the cluster
     */
    networkingConfig?: pulumi.Input<inputs.ServerlessClusterNetworkingConfig>;
    /**
     * Planned deletion information for the serverless cluster.
     */
    plannedDeletion?: pulumi.Input<inputs.ServerlessClusterPlannedDeletion>;
    /**
     * Private link ID for the serverless cluster. Must be set if private networking is enabled.
     */
    privateLinkId?: pulumi.Input<string>;
    /**
     * Prometheus metrics endpoints for the serverless cluster
     */
    prometheus?: pulumi.Input<inputs.ServerlessClusterPrometheus>;
    /**
     * The ID of the Resource Group in which to create the serverless cluster
     */
    resourceGroupId?: pulumi.Input<string>;
    /**
     * Schema Registry endpoints for the serverless cluster
     */
    schemaRegistry?: pulumi.Input<inputs.ServerlessClusterSchemaRegistry>;
    /**
     * Redpanda specific region of the serverless cluster
     */
    serverlessRegion?: pulumi.Input<string>;
    /**
     * Current state of the serverless cluster.
     */
    state?: pulumi.Input<string>;
    /**
     * Tags placed on cloud resources.
     */
    tags?: pulumi.Input<{
        [key: string]: pulumi.Input<string>;
    }>;
}
/**
 * The set of arguments for constructing a ServerlessCluster resource.
 */
export interface ServerlessClusterArgs {
    /**
     * Name of the serverless cluster
     */
    name?: pulumi.Input<string>;
    /**
     * Network configuration controlling public/private access to the cluster
     */
    networkingConfig?: pulumi.Input<inputs.ServerlessClusterNetworkingConfig>;
    /**
     * Private link ID for the serverless cluster. Must be set if private networking is enabled.
     */
    privateLinkId?: pulumi.Input<string>;
    /**
     * The ID of the Resource Group in which to create the serverless cluster
     */
    resourceGroupId: pulumi.Input<string>;
    /**
     * Redpanda specific region of the serverless cluster
     */
    serverlessRegion: pulumi.Input<string>;
    /**
     * Tags placed on cloud resources.
     */
    tags?: pulumi.Input<{
        [key: string]: pulumi.Input<string>;
    }>;
}
