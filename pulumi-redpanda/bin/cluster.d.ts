import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class Cluster extends pulumi.CustomResource {
    /**
     * Get an existing Cluster resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param state Any extra arguments used during the lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    static get(name: string, id: pulumi.Input<pulumi.ID>, state?: ClusterState, opts?: pulumi.CustomResourceOptions): Cluster;
    /**
     * Returns true if the given object is an instance of Cluster.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is Cluster;
    /**
     * Allows deletion of the cluster. Defaults to false.
     */
    readonly allowDeletion: pulumi.Output<boolean>;
    /**
     * API gateway access mode. Can be NETWORK_ACCESS_MODE_PRIVATE or NETWORK_ACCESS_MODE_PUBLIC.
     */
    readonly apiGatewayAccess: pulumi.Output<string>;
    /**
     * AWS PrivateLink configuration.
     */
    readonly awsPrivateLink: pulumi.Output<outputs.ClusterAwsPrivateLink | undefined>;
    /**
     * Azure Private Link configuration.
     */
    readonly azurePrivateLink: pulumi.Output<outputs.ClusterAzurePrivateLink | undefined>;
    /**
     * Cloud provider where resources are created.
     */
    readonly cloudProvider: pulumi.Output<string>;
    /**
     * Cloud storage configuration for tiered storage.
     */
    readonly cloudStorage: pulumi.Output<outputs.ClusterCloudStorage>;
    /**
     * The URL of the cluster API.
     */
    readonly clusterApiUrl: pulumi.Output<string>;
    /**
     * Configuration for the cluster.
     */
    readonly clusterConfiguration: pulumi.Output<outputs.ClusterClusterConfiguration>;
    /**
     * Cluster type. Type is immutable and can only be set on cluster creation. Can be either byoc or dedicated.
     */
    readonly clusterType: pulumi.Output<string>;
    /**
     * Cluster connection type. Private clusters are not exposed to the internet. For BYOC clusters, private is best-practice.
     */
    readonly connectionType: pulumi.Output<string>;
    /**
     * Timestamp when the cluster was created.
     */
    readonly createdAt: pulumi.Output<string>;
    /**
     * The actual running Redpanda version of the cluster.
     */
    readonly currentRedpandaVersion: pulumi.Output<string>;
    /**
     * Customer managed resources configuration for the cluster.
     */
    readonly customerManagedResources: pulumi.Output<outputs.ClusterCustomerManagedResources | undefined>;
    /**
     * The target Redpanda version during an upgrade.
     */
    readonly desiredRedpandaVersion: pulumi.Output<string>;
    /**
     * If true, GCP global access is enabled.
     */
    readonly gcpGlobalAccessEnabled: pulumi.Output<boolean | undefined>;
    /**
     * GCP Private Service Connect configuration.
     */
    readonly gcpPrivateServiceConnect: pulumi.Output<outputs.ClusterGcpPrivateServiceConnect | undefined>;
    /**
     * HTTP Proxy properties.
     */
    readonly httpProxy: pulumi.Output<outputs.ClusterHttpProxy>;
    /**
     * Cluster's Kafka API properties.
     */
    readonly kafkaApi: pulumi.Output<outputs.ClusterKafkaApi>;
    /**
     * Kafka Connect configuration.
     */
    readonly kafkaConnect: pulumi.Output<outputs.ClusterKafkaConnect>;
    /**
     * Maintenance window configuration for the cluster.
     */
    readonly maintenanceWindowConfig: pulumi.Output<outputs.ClusterMaintenanceWindowConfig>;
    /**
     * Unique name of the cluster.
     */
    readonly name: pulumi.Output<string>;
    /**
     * NAT gateway IP addresses for the cluster.
     */
    readonly natGateways: pulumi.Output<string[]>;
    /**
     * Network ID where cluster is placed.
     */
    readonly networkId: pulumi.Output<string>;
    /**
     * Prometheus metrics endpoint properties.
     */
    readonly prometheus: pulumi.Output<outputs.ClusterPrometheus>;
    /**
     * IDs of clusters that can create read-only topics from this cluster.
     */
    readonly readReplicaClusterIds: pulumi.Output<string[] | undefined>;
    /**
     * Redpanda Console properties.
     */
    readonly redpandaConsole: pulumi.Output<outputs.ClusterRedpandaConsole>;
    /**
     * Number of Redpanda nodes in the cluster. NOTE: This feature is not available for all customers by default. Contact your Redpanda account team to enable this feature.
     */
    readonly redpandaNodeCount: pulumi.Output<number>;
    /**
     * Current Redpanda version of the cluster.
     */
    readonly redpandaVersion: pulumi.Output<string | undefined>;
    /**
     * Cloud provider region. Region represents the name of the region where the cluster will be provisioned.
     */
    readonly region: pulumi.Output<string>;
    /**
     * Resource group ID of the cluster.
     */
    readonly resourceGroupId: pulumi.Output<string>;
    /**
     * Schema Registry properties.
     */
    readonly schemaRegistry: pulumi.Output<outputs.ClusterSchemaRegistry>;
    /**
     * Current state of the cluster.
     */
    readonly state: pulumi.Output<string>;
    /**
     * Detailed state description when cluster is in a non-ready state.
     */
    readonly stateDescription: pulumi.Output<outputs.ClusterStateDescription>;
    /**
     * Tags placed on cloud resources. If the cloud provider is GCP and the name of a tag has the prefix "gcp.network-tag.", the tag is a network tag that will be added to the Redpanda cluster GKE nodes. Otherwise, the tag is a normal tag. For example, if the name of a tag is "gcp.network-tag.network-tag-foo", the network tag named "network-tag-foo" will be added to the Redpanda cluster GKE nodes. Note: The value of a network tag will be ignored. See the details on network tags at https://cloud.google.com/vpc/docs/add-remove-network-tags.
     */
    readonly tags: pulumi.Output<{
        [key: string]: string;
    } | undefined>;
    /**
     * Usage tier of the cluster.
     */
    readonly throughputTier: pulumi.Output<string>;
    readonly timeouts: pulumi.Output<outputs.ClusterTimeouts | undefined>;
    /**
     * Zones of the cluster. Must be valid zones within the selected region. If multiple zones are used, the cluster is a multi-AZ cluster.
     */
    readonly zones: pulumi.Output<string[]>;
    /**
     * Create a Cluster resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: ClusterArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering Cluster resources.
 */
export interface ClusterState {
    /**
     * Allows deletion of the cluster. Defaults to false.
     */
    allowDeletion?: pulumi.Input<boolean>;
    /**
     * API gateway access mode. Can be NETWORK_ACCESS_MODE_PRIVATE or NETWORK_ACCESS_MODE_PUBLIC.
     */
    apiGatewayAccess?: pulumi.Input<string>;
    /**
     * AWS PrivateLink configuration.
     */
    awsPrivateLink?: pulumi.Input<inputs.ClusterAwsPrivateLink>;
    /**
     * Azure Private Link configuration.
     */
    azurePrivateLink?: pulumi.Input<inputs.ClusterAzurePrivateLink>;
    /**
     * Cloud provider where resources are created.
     */
    cloudProvider?: pulumi.Input<string>;
    /**
     * Cloud storage configuration for tiered storage.
     */
    cloudStorage?: pulumi.Input<inputs.ClusterCloudStorage>;
    /**
     * The URL of the cluster API.
     */
    clusterApiUrl?: pulumi.Input<string>;
    /**
     * Configuration for the cluster.
     */
    clusterConfiguration?: pulumi.Input<inputs.ClusterClusterConfiguration>;
    /**
     * Cluster type. Type is immutable and can only be set on cluster creation. Can be either byoc or dedicated.
     */
    clusterType?: pulumi.Input<string>;
    /**
     * Cluster connection type. Private clusters are not exposed to the internet. For BYOC clusters, private is best-practice.
     */
    connectionType?: pulumi.Input<string>;
    /**
     * Timestamp when the cluster was created.
     */
    createdAt?: pulumi.Input<string>;
    /**
     * The actual running Redpanda version of the cluster.
     */
    currentRedpandaVersion?: pulumi.Input<string>;
    /**
     * Customer managed resources configuration for the cluster.
     */
    customerManagedResources?: pulumi.Input<inputs.ClusterCustomerManagedResources>;
    /**
     * The target Redpanda version during an upgrade.
     */
    desiredRedpandaVersion?: pulumi.Input<string>;
    /**
     * If true, GCP global access is enabled.
     */
    gcpGlobalAccessEnabled?: pulumi.Input<boolean>;
    /**
     * GCP Private Service Connect configuration.
     */
    gcpPrivateServiceConnect?: pulumi.Input<inputs.ClusterGcpPrivateServiceConnect>;
    /**
     * HTTP Proxy properties.
     */
    httpProxy?: pulumi.Input<inputs.ClusterHttpProxy>;
    /**
     * Cluster's Kafka API properties.
     */
    kafkaApi?: pulumi.Input<inputs.ClusterKafkaApi>;
    /**
     * Kafka Connect configuration.
     */
    kafkaConnect?: pulumi.Input<inputs.ClusterKafkaConnect>;
    /**
     * Maintenance window configuration for the cluster.
     */
    maintenanceWindowConfig?: pulumi.Input<inputs.ClusterMaintenanceWindowConfig>;
    /**
     * Unique name of the cluster.
     */
    name?: pulumi.Input<string>;
    /**
     * NAT gateway IP addresses for the cluster.
     */
    natGateways?: pulumi.Input<pulumi.Input<string>[]>;
    /**
     * Network ID where cluster is placed.
     */
    networkId?: pulumi.Input<string>;
    /**
     * Prometheus metrics endpoint properties.
     */
    prometheus?: pulumi.Input<inputs.ClusterPrometheus>;
    /**
     * IDs of clusters that can create read-only topics from this cluster.
     */
    readReplicaClusterIds?: pulumi.Input<pulumi.Input<string>[]>;
    /**
     * Redpanda Console properties.
     */
    redpandaConsole?: pulumi.Input<inputs.ClusterRedpandaConsole>;
    /**
     * Number of Redpanda nodes in the cluster. NOTE: This feature is not available for all customers by default. Contact your Redpanda account team to enable this feature.
     */
    redpandaNodeCount?: pulumi.Input<number>;
    /**
     * Current Redpanda version of the cluster.
     */
    redpandaVersion?: pulumi.Input<string>;
    /**
     * Cloud provider region. Region represents the name of the region where the cluster will be provisioned.
     */
    region?: pulumi.Input<string>;
    /**
     * Resource group ID of the cluster.
     */
    resourceGroupId?: pulumi.Input<string>;
    /**
     * Schema Registry properties.
     */
    schemaRegistry?: pulumi.Input<inputs.ClusterSchemaRegistry>;
    /**
     * Current state of the cluster.
     */
    state?: pulumi.Input<string>;
    /**
     * Detailed state description when cluster is in a non-ready state.
     */
    stateDescription?: pulumi.Input<inputs.ClusterStateDescription>;
    /**
     * Tags placed on cloud resources. If the cloud provider is GCP and the name of a tag has the prefix "gcp.network-tag.", the tag is a network tag that will be added to the Redpanda cluster GKE nodes. Otherwise, the tag is a normal tag. For example, if the name of a tag is "gcp.network-tag.network-tag-foo", the network tag named "network-tag-foo" will be added to the Redpanda cluster GKE nodes. Note: The value of a network tag will be ignored. See the details on network tags at https://cloud.google.com/vpc/docs/add-remove-network-tags.
     */
    tags?: pulumi.Input<{
        [key: string]: pulumi.Input<string>;
    }>;
    /**
     * Usage tier of the cluster.
     */
    throughputTier?: pulumi.Input<string>;
    timeouts?: pulumi.Input<inputs.ClusterTimeouts>;
    /**
     * Zones of the cluster. Must be valid zones within the selected region. If multiple zones are used, the cluster is a multi-AZ cluster.
     */
    zones?: pulumi.Input<pulumi.Input<string>[]>;
}
/**
 * The set of arguments for constructing a Cluster resource.
 */
export interface ClusterArgs {
    /**
     * Allows deletion of the cluster. Defaults to false.
     */
    allowDeletion?: pulumi.Input<boolean>;
    /**
     * API gateway access mode. Can be NETWORK_ACCESS_MODE_PRIVATE or NETWORK_ACCESS_MODE_PUBLIC.
     */
    apiGatewayAccess?: pulumi.Input<string>;
    /**
     * AWS PrivateLink configuration.
     */
    awsPrivateLink?: pulumi.Input<inputs.ClusterAwsPrivateLink>;
    /**
     * Azure Private Link configuration.
     */
    azurePrivateLink?: pulumi.Input<inputs.ClusterAzurePrivateLink>;
    /**
     * Cloud provider where resources are created.
     */
    cloudProvider: pulumi.Input<string>;
    /**
     * Cloud storage configuration for tiered storage.
     */
    cloudStorage?: pulumi.Input<inputs.ClusterCloudStorage>;
    /**
     * Configuration for the cluster.
     */
    clusterConfiguration?: pulumi.Input<inputs.ClusterClusterConfiguration>;
    /**
     * Cluster type. Type is immutable and can only be set on cluster creation. Can be either byoc or dedicated.
     */
    clusterType: pulumi.Input<string>;
    /**
     * Cluster connection type. Private clusters are not exposed to the internet. For BYOC clusters, private is best-practice.
     */
    connectionType: pulumi.Input<string>;
    /**
     * Customer managed resources configuration for the cluster.
     */
    customerManagedResources?: pulumi.Input<inputs.ClusterCustomerManagedResources>;
    /**
     * If true, GCP global access is enabled.
     */
    gcpGlobalAccessEnabled?: pulumi.Input<boolean>;
    /**
     * GCP Private Service Connect configuration.
     */
    gcpPrivateServiceConnect?: pulumi.Input<inputs.ClusterGcpPrivateServiceConnect>;
    /**
     * HTTP Proxy properties.
     */
    httpProxy?: pulumi.Input<inputs.ClusterHttpProxy>;
    /**
     * Cluster's Kafka API properties.
     */
    kafkaApi?: pulumi.Input<inputs.ClusterKafkaApi>;
    /**
     * Kafka Connect configuration.
     */
    kafkaConnect?: pulumi.Input<inputs.ClusterKafkaConnect>;
    /**
     * Maintenance window configuration for the cluster.
     */
    maintenanceWindowConfig?: pulumi.Input<inputs.ClusterMaintenanceWindowConfig>;
    /**
     * Unique name of the cluster.
     */
    name?: pulumi.Input<string>;
    /**
     * Network ID where cluster is placed.
     */
    networkId: pulumi.Input<string>;
    /**
     * IDs of clusters that can create read-only topics from this cluster.
     */
    readReplicaClusterIds?: pulumi.Input<pulumi.Input<string>[]>;
    /**
     * Number of Redpanda nodes in the cluster. NOTE: This feature is not available for all customers by default. Contact your Redpanda account team to enable this feature.
     */
    redpandaNodeCount?: pulumi.Input<number>;
    /**
     * Current Redpanda version of the cluster.
     */
    redpandaVersion?: pulumi.Input<string>;
    /**
     * Cloud provider region. Region represents the name of the region where the cluster will be provisioned.
     */
    region: pulumi.Input<string>;
    /**
     * Resource group ID of the cluster.
     */
    resourceGroupId: pulumi.Input<string>;
    /**
     * Schema Registry properties.
     */
    schemaRegistry?: pulumi.Input<inputs.ClusterSchemaRegistry>;
    /**
     * Tags placed on cloud resources. If the cloud provider is GCP and the name of a tag has the prefix "gcp.network-tag.", the tag is a network tag that will be added to the Redpanda cluster GKE nodes. Otherwise, the tag is a normal tag. For example, if the name of a tag is "gcp.network-tag.network-tag-foo", the network tag named "network-tag-foo" will be added to the Redpanda cluster GKE nodes. Note: The value of a network tag will be ignored. See the details on network tags at https://cloud.google.com/vpc/docs/add-remove-network-tags.
     */
    tags?: pulumi.Input<{
        [key: string]: pulumi.Input<string>;
    }>;
    /**
     * Usage tier of the cluster.
     */
    throughputTier: pulumi.Input<string>;
    timeouts?: pulumi.Input<inputs.ClusterTimeouts>;
    /**
     * Zones of the cluster. Must be valid zones within the selected region. If multiple zones are used, the cluster is a multi-AZ cluster.
     */
    zones: pulumi.Input<pulumi.Input<string>[]>;
}
