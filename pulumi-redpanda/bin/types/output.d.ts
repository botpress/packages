import * as outputs from "../types/output";
export interface ClusterAwsPrivateLink {
    /**
     * The ARN of the principals that can access the Redpanda AWS PrivateLink Endpoint Service. To grant permissions to all principals, use an asterisk (*).
     */
    allowedPrincipals: string[];
    /**
     * Whether Console is connected via PrivateLink.
     */
    connectConsole: boolean;
    /**
     * Whether AWS PrivateLink is enabled.
     */
    enabled: boolean;
    /**
     * Current status of the PrivateLink configuration.
     */
    status: outputs.ClusterAwsPrivateLinkStatus;
    /**
     * Supported regions for AWS PrivateLink.
     */
    supportedRegions: string[];
}
export interface ClusterAwsPrivateLinkStatus {
    /**
     * Port for Redpanda Console.
     */
    consolePort: number;
    /**
     * When the PrivateLink service was created.
     */
    createdAt: string;
    /**
     * When the PrivateLink service was deleted.
     */
    deletedAt: string;
    /**
     * Base port for Kafka API nodes.
     */
    kafkaApiNodeBasePort: number;
    /**
     * Port for Kafka API seed brokers.
     */
    kafkaApiSeedPort: number;
    /**
     * Base port for HTTP proxy nodes.
     */
    redpandaProxyNodeBasePort: number;
    /**
     * Port for HTTP proxy.
     */
    redpandaProxySeedPort: number;
    /**
     * Port for Schema Registry.
     */
    schemaRegistrySeedPort: number;
    /**
     * The PrivateLink service ID.
     */
    serviceId: string;
    /**
     * The PrivateLink service name.
     */
    serviceName: string;
    /**
     * Current state of the PrivateLink service.
     */
    serviceState: string;
    /**
     * List of VPC endpoint connections.
     */
    vpcEndpointConnections: outputs.ClusterAwsPrivateLinkStatusVpcEndpointConnection[];
}
export interface ClusterAwsPrivateLinkStatusVpcEndpointConnection {
    /**
     * The connection ID.
     */
    connectionId: string;
    /**
     * When the endpoint connection was created.
     */
    createdAt: string;
    /**
     * DNS entries for the endpoint.
     */
    dnsEntries: outputs.ClusterAwsPrivateLinkStatusVpcEndpointConnectionDnsEntry[];
    /**
     * The endpoint connection ID.
     */
    id: string;
    /**
     * ARNs of associated load balancers.
     */
    loadBalancerArns: string[];
    /**
     * Owner of the endpoint connection.
     */
    owner: string;
    /**
     * State of the endpoint connection.
     */
    state: string;
}
export interface ClusterAwsPrivateLinkStatusVpcEndpointConnectionDnsEntry {
    /**
     * The DNS name.
     */
    dnsName: string;
    /**
     * The hosted zone ID.
     */
    hostedZoneId: string;
}
export interface ClusterAzurePrivateLink {
    /**
     * The subscriptions that can access the Redpanda Azure PrivateLink Endpoint Service. To grant permissions to all principals, use an asterisk (*).
     */
    allowedSubscriptions: string[];
    /**
     * Whether Console is connected in Redpanda Azure Private Link Service.
     */
    connectConsole: boolean;
    /**
     * Whether Redpanda Azure Private Link Endpoint Service is enabled.
     */
    enabled: boolean;
    /**
     * Current status of the Private Link configuration.
     */
    status: outputs.ClusterAzurePrivateLinkStatus;
}
export interface ClusterAzurePrivateLinkStatus {
    /**
     * List of approved Azure subscription IDs.
     */
    approvedSubscriptions: string[];
    /**
     * Port for Redpanda Console.
     */
    consolePort: number;
    /**
     * When the Private Link service was created.
     */
    createdAt: string;
    /**
     * When the Private Link service was deleted.
     */
    deletedAt: string;
    /**
     * DNS A record for the service.
     */
    dnsARecord: string;
    /**
     * Base port for Kafka API nodes.
     */
    kafkaApiNodeBasePort: number;
    /**
     * Port for Kafka API seed brokers.
     */
    kafkaApiSeedPort: number;
    /**
     * List of private endpoint connections.
     */
    privateEndpointConnections: outputs.ClusterAzurePrivateLinkStatusPrivateEndpointConnection[];
    /**
     * Base port for HTTP proxy nodes.
     */
    redpandaProxyNodeBasePort: number;
    /**
     * Port for HTTP proxy.
     */
    redpandaProxySeedPort: number;
    /**
     * Port for Schema Registry.
     */
    schemaRegistrySeedPort: number;
    /**
     * The Private Link service ID.
     */
    serviceId: string;
    /**
     * The Private Link service name.
     */
    serviceName: string;
}
export interface ClusterAzurePrivateLinkStatusPrivateEndpointConnection {
    /**
     * ID of the connection.
     */
    connectionId: string;
    /**
     * Name of the connection.
     */
    connectionName: string;
    /**
     * When the endpoint connection was created.
     */
    createdAt: string;
    /**
     * ID of the private endpoint.
     */
    privateEndpointId: string;
    /**
     * Name of the private endpoint.
     */
    privateEndpointName: string;
    /**
     * Status of the endpoint connection.
     */
    status: string;
}
export interface ClusterCloudStorage {
    /**
     * AWS cloud storage configuration.
     */
    aws: outputs.ClusterCloudStorageAws;
    /**
     * Azure cloud storage configuration.
     */
    azure: outputs.ClusterCloudStorageAzure;
    /**
     * GCP cloud storage configuration.
     */
    gcp: outputs.ClusterCloudStorageGcp;
    /**
     * If true, cloud storage is not deleted when the cluster is destroyed.
     */
    skipDestroy?: boolean;
}
export interface ClusterCloudStorageAws {
    /**
     * ARN of the AWS S3 bucket.
     */
    arn: string;
}
export interface ClusterCloudStorageAzure {
    /**
     * Name of the Azure storage container.
     */
    containerName: string;
    /**
     * Name of the Azure storage account.
     */
    storageAccountName: string;
}
export interface ClusterCloudStorageGcp {
    /**
     * Name of the GCP storage bucket.
     */
    name: string;
}
export interface ClusterClusterConfiguration {
    /**
     * Custom properties for the cluster in JSON format.
     */
    customPropertiesJson?: string;
}
export interface ClusterCustomerManagedResources {
    aws?: outputs.ClusterCustomerManagedResourcesAws;
    gcp?: outputs.ClusterCustomerManagedResourcesGcp;
}
export interface ClusterCustomerManagedResourcesAws {
    agentInstanceProfile: outputs.ClusterCustomerManagedResourcesAwsAgentInstanceProfile;
    cloudStorageBucket: outputs.ClusterCustomerManagedResourcesAwsCloudStorageBucket;
    clusterSecurityGroup: outputs.ClusterCustomerManagedResourcesAwsClusterSecurityGroup;
    connectorsNodeGroupInstanceProfile: outputs.ClusterCustomerManagedResourcesAwsConnectorsNodeGroupInstanceProfile;
    connectorsSecurityGroup: outputs.ClusterCustomerManagedResourcesAwsConnectorsSecurityGroup;
    k8sClusterRole: outputs.ClusterCustomerManagedResourcesAwsK8sClusterRole;
    nodeSecurityGroup: outputs.ClusterCustomerManagedResourcesAwsNodeSecurityGroup;
    permissionsBoundaryPolicy: outputs.ClusterCustomerManagedResourcesAwsPermissionsBoundaryPolicy;
    redpandaAgentSecurityGroup: outputs.ClusterCustomerManagedResourcesAwsRedpandaAgentSecurityGroup;
    redpandaConnectNodeGroupInstanceProfile?: outputs.ClusterCustomerManagedResourcesAwsRedpandaConnectNodeGroupInstanceProfile;
    redpandaConnectSecurityGroup?: outputs.ClusterCustomerManagedResourcesAwsRedpandaConnectSecurityGroup;
    redpandaNodeGroupInstanceProfile: outputs.ClusterCustomerManagedResourcesAwsRedpandaNodeGroupInstanceProfile;
    redpandaNodeGroupSecurityGroup: outputs.ClusterCustomerManagedResourcesAwsRedpandaNodeGroupSecurityGroup;
    utilityNodeGroupInstanceProfile: outputs.ClusterCustomerManagedResourcesAwsUtilityNodeGroupInstanceProfile;
    utilitySecurityGroup: outputs.ClusterCustomerManagedResourcesAwsUtilitySecurityGroup;
}
export interface ClusterCustomerManagedResourcesAwsAgentInstanceProfile {
    /**
     * ARN for the agent instance profile
     */
    arn: string;
}
export interface ClusterCustomerManagedResourcesAwsCloudStorageBucket {
    /**
     * ARN for the cloud storage bucket
     */
    arn: string;
}
export interface ClusterCustomerManagedResourcesAwsClusterSecurityGroup {
    /**
     * ARN for the cluster security group
     */
    arn: string;
}
export interface ClusterCustomerManagedResourcesAwsConnectorsNodeGroupInstanceProfile {
    /**
     * ARN for the connectors node group instance profile
     */
    arn: string;
}
export interface ClusterCustomerManagedResourcesAwsConnectorsSecurityGroup {
    /**
     * ARN for the connectors security group
     */
    arn: string;
}
export interface ClusterCustomerManagedResourcesAwsK8sClusterRole {
    /**
     * ARN for the Kubernetes cluster role
     */
    arn: string;
}
export interface ClusterCustomerManagedResourcesAwsNodeSecurityGroup {
    /**
     * ARN for the node security group
     */
    arn: string;
}
export interface ClusterCustomerManagedResourcesAwsPermissionsBoundaryPolicy {
    /**
     * ARN for the permissions boundary policy
     */
    arn: string;
}
export interface ClusterCustomerManagedResourcesAwsRedpandaAgentSecurityGroup {
    /**
     * ARN for the redpanda agent security group
     */
    arn: string;
}
export interface ClusterCustomerManagedResourcesAwsRedpandaConnectNodeGroupInstanceProfile {
    /**
     * ARN for the Redpanda Connect node group instance profile
     */
    arn: string;
}
export interface ClusterCustomerManagedResourcesAwsRedpandaConnectSecurityGroup {
    /**
     * ARN for the Redpanda Connect security group
     */
    arn: string;
}
export interface ClusterCustomerManagedResourcesAwsRedpandaNodeGroupInstanceProfile {
    /**
     * ARN for the redpanda node group instance profile
     */
    arn: string;
}
export interface ClusterCustomerManagedResourcesAwsRedpandaNodeGroupSecurityGroup {
    /**
     * ARN for the redpanda node group security group
     */
    arn: string;
}
export interface ClusterCustomerManagedResourcesAwsUtilityNodeGroupInstanceProfile {
    /**
     * ARN for the utility node group instance profile
     */
    arn: string;
}
export interface ClusterCustomerManagedResourcesAwsUtilitySecurityGroup {
    /**
     * ARN for the utility security group
     */
    arn: string;
}
export interface ClusterCustomerManagedResourcesGcp {
    /**
     * GCP service account for the agent.
     */
    agentServiceAccount: outputs.ClusterCustomerManagedResourcesGcpAgentServiceAccount;
    /**
     * GCP service account for managed connectors.
     */
    connectorServiceAccount: outputs.ClusterCustomerManagedResourcesGcpConnectorServiceAccount;
    /**
     * GCP service account for Redpanda Console.
     */
    consoleServiceAccount: outputs.ClusterCustomerManagedResourcesGcpConsoleServiceAccount;
    /**
     * GCP service account for GCP Kubernetes Engine (GKE).
     */
    gkeServiceAccount: outputs.ClusterCustomerManagedResourcesGcpGkeServiceAccount;
    /**
     * NAT subnet name if GCP Private Service Connect is enabled.
     */
    pscNatSubnetName?: string;
    /**
     * GCP service account for the Redpanda cluster.
     */
    redpandaClusterServiceAccount: outputs.ClusterCustomerManagedResourcesGcpRedpandaClusterServiceAccount;
    /**
     * GCP subnet where Redpanda cluster is deployed.
     */
    subnet: outputs.ClusterCustomerManagedResourcesGcpSubnet;
    /**
     * GCP storage bucket for Tiered storage.
     */
    tieredStorageBucket: outputs.ClusterCustomerManagedResourcesGcpTieredStorageBucket;
}
export interface ClusterCustomerManagedResourcesGcpAgentServiceAccount {
    /**
     * GCP service account email.
     */
    email: string;
}
export interface ClusterCustomerManagedResourcesGcpConnectorServiceAccount {
    /**
     * GCP service account email.
     */
    email: string;
}
export interface ClusterCustomerManagedResourcesGcpConsoleServiceAccount {
    /**
     * GCP service account email.
     */
    email: string;
}
export interface ClusterCustomerManagedResourcesGcpGkeServiceAccount {
    /**
     * GCP service account email.
     */
    email: string;
}
export interface ClusterCustomerManagedResourcesGcpRedpandaClusterServiceAccount {
    /**
     * GCP service account email.
     */
    email: string;
}
export interface ClusterCustomerManagedResourcesGcpSubnet {
    /**
     * Kubernetes Master IPv4 range, e.g. 10.0.0.0/24.
     */
    k8sMasterIpv4Range: string;
    /**
     * Subnet name.
     */
    name: string;
    /**
     * Secondary IPv4 range for pods.
     */
    secondaryIpv4RangePods: outputs.ClusterCustomerManagedResourcesGcpSubnetSecondaryIpv4RangePods;
    /**
     * Secondary IPv4 range for services.
     */
    secondaryIpv4RangeServices: outputs.ClusterCustomerManagedResourcesGcpSubnetSecondaryIpv4RangeServices;
}
export interface ClusterCustomerManagedResourcesGcpSubnetSecondaryIpv4RangePods {
    /**
     * Secondary IPv4 range name for pods.
     */
    name: string;
}
export interface ClusterCustomerManagedResourcesGcpSubnetSecondaryIpv4RangeServices {
    /**
     * Secondary IPv4 range name for services.
     */
    name: string;
}
export interface ClusterCustomerManagedResourcesGcpTieredStorageBucket {
    /**
     * GCP storage bucket name.
     */
    name: string;
}
export interface ClusterGcpPrivateServiceConnect {
    /**
     * List of consumers that are allowed to connect to Redpanda GCP PSC (Private Service Connect) service attachment.
     */
    consumerAcceptLists: outputs.ClusterGcpPrivateServiceConnectConsumerAcceptList[];
    /**
     * Whether Redpanda GCP Private Service Connect is enabled.
     */
    enabled: boolean;
    /**
     * Whether global access is enabled.
     */
    globalAccessEnabled: boolean;
    /**
     * Current status of the Private Service Connect configuration.
     */
    status: outputs.ClusterGcpPrivateServiceConnectStatus;
}
export interface ClusterGcpPrivateServiceConnectConsumerAcceptList {
    /**
     * Either the GCP project number or its alphanumeric ID.
     */
    source: string;
}
export interface ClusterGcpPrivateServiceConnectStatus {
    /**
     * List of connected endpoints.
     */
    connectedEndpoints: outputs.ClusterGcpPrivateServiceConnectStatusConnectedEndpoint[];
    /**
     * When the Private Service Connect service was created.
     */
    createdAt: string;
    /**
     * When the Private Service Connect service was deleted.
     */
    deletedAt: string;
    /**
     * DNS A records for the service.
     */
    dnsARecords: string[];
    /**
     * Base port for Kafka API nodes.
     */
    kafkaApiNodeBasePort: number;
    /**
     * Port for Kafka API seed brokers.
     */
    kafkaApiSeedPort: number;
    /**
     * Base port for HTTP proxy nodes.
     */
    redpandaProxyNodeBasePort: number;
    /**
     * Port for HTTP proxy.
     */
    redpandaProxySeedPort: number;
    /**
     * Port for Schema Registry.
     */
    schemaRegistrySeedPort: number;
    /**
     * Hostname for the seed brokers.
     */
    seedHostname: string;
    /**
     * The service attachment identifier.
     */
    serviceAttachment: string;
}
export interface ClusterGcpPrivateServiceConnectStatusConnectedEndpoint {
    /**
     * The connection ID.
     */
    connectionId: string;
    /**
     * The consumer network.
     */
    consumerNetwork: string;
    /**
     * The endpoint address.
     */
    endpoint: string;
    /**
     * Status of the endpoint connection.
     */
    status: string;
}
export interface ClusterHttpProxy {
    /**
     * All HTTP proxy endpoint variants.
     */
    allUrls: outputs.ClusterHttpProxyAllUrls;
    /**
     * mTLS configuration.
     */
    mtls: outputs.ClusterHttpProxyMtls;
    /**
     * SASL configuration.
     */
    sasl: outputs.ClusterHttpProxySasl;
    /**
     * The HTTP Proxy URL.
     */
    url: string;
}
export interface ClusterHttpProxyAllUrls {
    /**
     * mTLS endpoint.
     */
    mtls: string;
    /**
     * Private link mTLS endpoint.
     */
    privateLinkMtls: string;
    /**
     * Private link SASL endpoint.
     */
    privateLinkSasl: string;
    /**
     * SASL endpoint.
     */
    sasl: string;
}
export interface ClusterHttpProxyMtls {
    /**
     * CA certificate in PEM format.
     */
    caCertificatesPems?: string[];
    /**
     * Whether mTLS is enabled.
     */
    enabled: boolean;
    /**
     * Principal mapping rules for mTLS authentication. See the Redpanda documentation on configuring authentication.
     */
    principalMappingRules?: string[];
}
export interface ClusterHttpProxySasl {
    /**
     * Whether SASL is enabled.
     */
    enabled: boolean;
}
export interface ClusterKafkaApi {
    /**
     * All seed broker endpoint variants.
     */
    allSeedBrokers: outputs.ClusterKafkaApiAllSeedBrokers;
    /**
     * mTLS configuration.
     */
    mtls: outputs.ClusterKafkaApiMtls;
    /**
     * SASL configuration.
     */
    sasl: outputs.ClusterKafkaApiSasl;
    /**
     * List of Kafka broker addresses.
     */
    seedBrokers: string[];
}
export interface ClusterKafkaApiAllSeedBrokers {
    /**
     * mTLS endpoint.
     */
    mtls: string;
    /**
     * Private link mTLS endpoint.
     */
    privateLinkMtls: string;
    /**
     * Private link SASL endpoint.
     */
    privateLinkSasl: string;
    /**
     * SASL endpoint.
     */
    sasl: string;
}
export interface ClusterKafkaApiMtls {
    /**
     * CA certificate in PEM format.
     */
    caCertificatesPems?: string[];
    /**
     * Whether mTLS is enabled.
     */
    enabled: boolean;
    /**
     * Principal mapping rules for mTLS authentication. See the Redpanda documentation on configuring authentication.
     */
    principalMappingRules?: string[];
}
export interface ClusterKafkaApiSasl {
    /**
     * Whether SASL is enabled.
     */
    enabled: boolean;
}
export interface ClusterKafkaConnect {
    /**
     * Whether Kafka Connect is enabled.
     */
    enabled: boolean;
}
export interface ClusterMaintenanceWindowConfig {
    /**
     * If true, maintenance can occur at any time.
     */
    anytime?: boolean;
    dayHour?: outputs.ClusterMaintenanceWindowConfigDayHour;
    /**
     * If true, maintenance window is unspecified.
     */
    unspecified: boolean;
}
export interface ClusterMaintenanceWindowConfigDayHour {
    /**
     * Day of week.
     */
    dayOfWeek?: string;
    /**
     * Hour of day.
     */
    hourOfDay?: number;
}
export interface ClusterPrometheus {
    /**
     * The Prometheus metrics endpoint URL.
     */
    url: string;
}
export interface ClusterRedpandaConsole {
    /**
     * The Redpanda Console URL.
     */
    url: string;
}
export interface ClusterSchemaRegistry {
    /**
     * All schema registry endpoint variants.
     */
    allUrls: outputs.ClusterSchemaRegistryAllUrls;
    /**
     * mTLS configuration.
     */
    mtls?: outputs.ClusterSchemaRegistryMtls;
    /**
     * The Schema Registry URL.
     */
    url: string;
}
export interface ClusterSchemaRegistryAllUrls {
    /**
     * mTLS endpoint.
     */
    mtls: string;
    /**
     * Private link mTLS endpoint.
     */
    privateLinkMtls: string;
    /**
     * Private link SASL endpoint.
     */
    privateLinkSasl: string;
    /**
     * SASL endpoint.
     */
    sasl: string;
}
export interface ClusterSchemaRegistryMtls {
    /**
     * CA certificate in PEM format.
     */
    caCertificatesPems?: string[];
    /**
     * Whether mTLS is enabled.
     */
    enabled: boolean;
    /**
     * Principal mapping rules for mTLS authentication. See the Redpanda documentation on configuring authentication.
     */
    principalMappingRules?: string[];
}
export interface ClusterStateDescription {
    /**
     * Error code if cluster is in error state.
     */
    code: number;
    /**
     * Detailed error message if cluster is in error state.
     */
    message: string;
}
export interface ClusterTimeouts {
    /**
     * A string that can be [parsed as a duration](https://pkg.go.dev/time#ParseDuration) consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours).
     */
    create?: string;
    /**
     * A string that can be [parsed as a duration](https://pkg.go.dev/time#ParseDuration) consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Setting a timeout for a Delete operation is only applicable if changes are saved into state before the destroy operation occurs.
     */
    delete?: string;
    /**
     * A string that can be [parsed as a duration](https://pkg.go.dev/time#ParseDuration) consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours).
     */
    update?: string;
}
export interface GetClusterAwsPrivateLink {
    /**
     * The ARN of the principals that can access the Redpanda AWS PrivateLink Endpoint Service.
     */
    allowedPrincipals: string[];
    /**
     * Whether Console is connected via PrivateLink.
     */
    connectConsole: boolean;
    /**
     * Whether AWS PrivateLink is enabled.
     */
    enabled: boolean;
    /**
     * Current status of the PrivateLink configuration.
     */
    status: outputs.GetClusterAwsPrivateLinkStatus;
    /**
     * Supported regions for AWS PrivateLink.
     */
    supportedRegions: string[];
}
export interface GetClusterAwsPrivateLinkStatus {
    /**
     * Port for Redpanda Console.
     */
    consolePort: number;
    /**
     * When the PrivateLink service was created.
     */
    createdAt: string;
    /**
     * When the PrivateLink service was deleted.
     */
    deletedAt: string;
    /**
     * Base port for Kafka API nodes.
     */
    kafkaApiNodeBasePort: number;
    /**
     * Port for Kafka API seed brokers.
     */
    kafkaApiSeedPort: number;
    /**
     * Base port for HTTP proxy nodes.
     */
    redpandaProxyNodeBasePort: number;
    /**
     * Port for HTTP proxy.
     */
    redpandaProxySeedPort: number;
    /**
     * Port for Schema Registry.
     */
    schemaRegistrySeedPort: number;
    /**
     * The PrivateLink service ID.
     */
    serviceId: string;
    /**
     * The PrivateLink service name.
     */
    serviceName: string;
    /**
     * Current state of the PrivateLink service.
     */
    serviceState: string;
    /**
     * List of VPC endpoint connections.
     */
    vpcEndpointConnections: outputs.GetClusterAwsPrivateLinkStatusVpcEndpointConnection[];
}
export interface GetClusterAwsPrivateLinkStatusVpcEndpointConnection {
    /**
     * The connection ID.
     */
    connectionId: string;
    /**
     * When the endpoint connection was created.
     */
    createdAt: string;
    /**
     * DNS entries for the endpoint.
     */
    dnsEntries: outputs.GetClusterAwsPrivateLinkStatusVpcEndpointConnectionDnsEntry[];
    /**
     * The endpoint connection ID.
     */
    id: string;
    /**
     * ARNs of associated load balancers.
     */
    loadBalancerArns: string[];
    /**
     * Owner of the endpoint connection.
     */
    owner: string;
    /**
     * State of the endpoint connection.
     */
    state: string;
}
export interface GetClusterAwsPrivateLinkStatusVpcEndpointConnectionDnsEntry {
    /**
     * The DNS name.
     */
    dnsName: string;
    /**
     * The hosted zone ID.
     */
    hostedZoneId: string;
}
export interface GetClusterAzurePrivateLink {
    /**
     * The subscriptions that can access the Redpanda Azure PrivateLink Endpoint Service.
     */
    allowedSubscriptions: string[];
    /**
     * Whether Console is connected in Redpanda Azure Private Link Service.
     */
    connectConsole: boolean;
    /**
     * Whether Redpanda Azure Private Link Endpoint Service is enabled.
     */
    enabled: boolean;
    /**
     * Current status of the Private Link configuration.
     */
    status: outputs.GetClusterAzurePrivateLinkStatus;
}
export interface GetClusterAzurePrivateLinkStatus {
    /**
     * List of approved Azure subscription IDs.
     */
    approvedSubscriptions: string[];
    /**
     * Port for Redpanda Console.
     */
    consolePort: number;
    /**
     * When the Private Link service was created.
     */
    createdAt: string;
    /**
     * When the Private Link service was deleted.
     */
    deletedAt: string;
    /**
     * DNS A record for the service.
     */
    dnsARecord: string;
    /**
     * Base port for Kafka API nodes.
     */
    kafkaApiNodeBasePort: number;
    /**
     * Port for Kafka API seed brokers.
     */
    kafkaApiSeedPort: number;
    /**
     * List of private endpoint connections.
     */
    privateEndpointConnections: outputs.GetClusterAzurePrivateLinkStatusPrivateEndpointConnection[];
    /**
     * Base port for HTTP proxy nodes.
     */
    redpandaProxyNodeBasePort: number;
    /**
     * Port for HTTP proxy.
     */
    redpandaProxySeedPort: number;
    /**
     * Port for Schema Registry.
     */
    schemaRegistrySeedPort: number;
    /**
     * The Private Link service ID.
     */
    serviceId: string;
    /**
     * The Private Link service name.
     */
    serviceName: string;
}
export interface GetClusterAzurePrivateLinkStatusPrivateEndpointConnection {
    /**
     * ID of the connection.
     */
    connectionId: string;
    /**
     * Name of the connection.
     */
    connectionName: string;
    /**
     * When the endpoint connection was created.
     */
    createdAt: string;
    /**
     * ID of the private endpoint.
     */
    privateEndpointId: string;
    /**
     * Name of the private endpoint.
     */
    privateEndpointName: string;
    /**
     * Status of the endpoint connection.
     */
    status: string;
}
export interface GetClusterClusterConfiguration {
    /**
     * Custom properties for the cluster in JSON format.
     */
    customPropertiesJson: string;
}
export interface GetClusterCustomerManagedResources {
    aws: outputs.GetClusterCustomerManagedResourcesAws;
    gcp: outputs.GetClusterCustomerManagedResourcesGcp;
}
export interface GetClusterCustomerManagedResourcesAws {
    agentInstanceProfile: outputs.GetClusterCustomerManagedResourcesAwsAgentInstanceProfile;
    cloudStorageBucket: outputs.GetClusterCustomerManagedResourcesAwsCloudStorageBucket;
    clusterSecurityGroup: outputs.GetClusterCustomerManagedResourcesAwsClusterSecurityGroup;
    connectorsNodeGroupInstanceProfile: outputs.GetClusterCustomerManagedResourcesAwsConnectorsNodeGroupInstanceProfile;
    connectorsSecurityGroup: outputs.GetClusterCustomerManagedResourcesAwsConnectorsSecurityGroup;
    k8sClusterRole: outputs.GetClusterCustomerManagedResourcesAwsK8sClusterRole;
    nodeSecurityGroup: outputs.GetClusterCustomerManagedResourcesAwsNodeSecurityGroup;
    permissionsBoundaryPolicy: outputs.GetClusterCustomerManagedResourcesAwsPermissionsBoundaryPolicy;
    redpandaAgentSecurityGroup: outputs.GetClusterCustomerManagedResourcesAwsRedpandaAgentSecurityGroup;
    redpandaConnectNodeGroupInstanceProfile: outputs.GetClusterCustomerManagedResourcesAwsRedpandaConnectNodeGroupInstanceProfile;
    redpandaConnectSecurityGroup: outputs.GetClusterCustomerManagedResourcesAwsRedpandaConnectSecurityGroup;
    redpandaNodeGroupInstanceProfile: outputs.GetClusterCustomerManagedResourcesAwsRedpandaNodeGroupInstanceProfile;
    redpandaNodeGroupSecurityGroup: outputs.GetClusterCustomerManagedResourcesAwsRedpandaNodeGroupSecurityGroup;
    utilityNodeGroupInstanceProfile: outputs.GetClusterCustomerManagedResourcesAwsUtilityNodeGroupInstanceProfile;
    utilitySecurityGroup: outputs.GetClusterCustomerManagedResourcesAwsUtilitySecurityGroup;
}
export interface GetClusterCustomerManagedResourcesAwsAgentInstanceProfile {
    /**
     * ARN for the agent instance profile
     */
    arn: string;
}
export interface GetClusterCustomerManagedResourcesAwsCloudStorageBucket {
    /**
     * ARN for the cloud storage bucket
     */
    arn: string;
}
export interface GetClusterCustomerManagedResourcesAwsClusterSecurityGroup {
    /**
     * ARN for the cluster security group
     */
    arn: string;
}
export interface GetClusterCustomerManagedResourcesAwsConnectorsNodeGroupInstanceProfile {
    /**
     * ARN for the connectors node group instance profile
     */
    arn: string;
}
export interface GetClusterCustomerManagedResourcesAwsConnectorsSecurityGroup {
    /**
     * ARN for the connectors security group
     */
    arn: string;
}
export interface GetClusterCustomerManagedResourcesAwsK8sClusterRole {
    /**
     * ARN for the Kubernetes cluster role
     */
    arn: string;
}
export interface GetClusterCustomerManagedResourcesAwsNodeSecurityGroup {
    /**
     * ARN for the node security group
     */
    arn: string;
}
export interface GetClusterCustomerManagedResourcesAwsPermissionsBoundaryPolicy {
    /**
     * ARN for the permissions boundary policy
     */
    arn: string;
}
export interface GetClusterCustomerManagedResourcesAwsRedpandaAgentSecurityGroup {
    /**
     * ARN for the redpanda agent security group
     */
    arn: string;
}
export interface GetClusterCustomerManagedResourcesAwsRedpandaConnectNodeGroupInstanceProfile {
    /**
     * ARN for the Redpanda Connect node group instance profile
     */
    arn: string;
}
export interface GetClusterCustomerManagedResourcesAwsRedpandaConnectSecurityGroup {
    /**
     * ARN for the Redpanda Connect security group
     */
    arn: string;
}
export interface GetClusterCustomerManagedResourcesAwsRedpandaNodeGroupInstanceProfile {
    /**
     * ARN for the redpanda node group instance profile
     */
    arn: string;
}
export interface GetClusterCustomerManagedResourcesAwsRedpandaNodeGroupSecurityGroup {
    /**
     * ARN for the redpanda node group security group
     */
    arn: string;
}
export interface GetClusterCustomerManagedResourcesAwsUtilityNodeGroupInstanceProfile {
    /**
     * ARN for the utility node group instance profile
     */
    arn: string;
}
export interface GetClusterCustomerManagedResourcesAwsUtilitySecurityGroup {
    /**
     * ARN for the utility security group
     */
    arn: string;
}
export interface GetClusterCustomerManagedResourcesGcp {
    /**
     * GCP service account for the agent.
     */
    agentServiceAccount: outputs.GetClusterCustomerManagedResourcesGcpAgentServiceAccount;
    /**
     * GCP service account for managed connectors.
     */
    connectorServiceAccount: outputs.GetClusterCustomerManagedResourcesGcpConnectorServiceAccount;
    /**
     * GCP service account for Redpanda Console.
     */
    consoleServiceAccount: outputs.GetClusterCustomerManagedResourcesGcpConsoleServiceAccount;
    /**
     * GCP service account for GCP Kubernetes Engine (GKE).
     */
    gkeServiceAccount: outputs.GetClusterCustomerManagedResourcesGcpGkeServiceAccount;
    /**
     * NAT subnet name if GCP Private Service Connect is enabled.
     */
    pscNatSubnetName: string;
    /**
     * GCP service account for the Redpanda cluster.
     */
    redpandaClusterServiceAccount: outputs.GetClusterCustomerManagedResourcesGcpRedpandaClusterServiceAccount;
    /**
     * GCP subnet where Redpanda cluster is deployed.
     */
    subnet: outputs.GetClusterCustomerManagedResourcesGcpSubnet;
    /**
     * GCP storage bucket for Tiered storage.
     */
    tieredStorageBucket: outputs.GetClusterCustomerManagedResourcesGcpTieredStorageBucket;
}
export interface GetClusterCustomerManagedResourcesGcpAgentServiceAccount {
    /**
     * GCP service account email.
     */
    email: string;
}
export interface GetClusterCustomerManagedResourcesGcpConnectorServiceAccount {
    /**
     * GCP service account email.
     */
    email: string;
}
export interface GetClusterCustomerManagedResourcesGcpConsoleServiceAccount {
    /**
     * GCP service account email.
     */
    email: string;
}
export interface GetClusterCustomerManagedResourcesGcpGkeServiceAccount {
    /**
     * GCP service account email.
     */
    email: string;
}
export interface GetClusterCustomerManagedResourcesGcpRedpandaClusterServiceAccount {
    /**
     * GCP service account email.
     */
    email: string;
}
export interface GetClusterCustomerManagedResourcesGcpSubnet {
    /**
     * Kubernetes Master IPv4 range, e.g. 10.0.0.0/24.
     */
    k8sMasterIpv4Range: string;
    /**
     * Subnet name.
     */
    name: string;
    /**
     * Secondary IPv4 range for pods.
     */
    secondaryIpv4RangePods: outputs.GetClusterCustomerManagedResourcesGcpSubnetSecondaryIpv4RangePods;
    /**
     * Secondary IPv4 range for services.
     */
    secondaryIpv4RangeServices: outputs.GetClusterCustomerManagedResourcesGcpSubnetSecondaryIpv4RangeServices;
}
export interface GetClusterCustomerManagedResourcesGcpSubnetSecondaryIpv4RangePods {
    /**
     * Secondary IPv4 range name for pods.
     */
    name: string;
}
export interface GetClusterCustomerManagedResourcesGcpSubnetSecondaryIpv4RangeServices {
    /**
     * Secondary IPv4 range name for services.
     */
    name: string;
}
export interface GetClusterCustomerManagedResourcesGcpTieredStorageBucket {
    /**
     * GCP storage bucket name.
     */
    name: string;
}
export interface GetClusterGcpPrivateServiceConnect {
    /**
     * List of consumers that are allowed to connect to Redpanda GCP PSC service attachment.
     */
    consumerAcceptLists: outputs.GetClusterGcpPrivateServiceConnectConsumerAcceptList[];
    /**
     * Whether Redpanda GCP Private Service Connect is enabled.
     */
    enabled: boolean;
    /**
     * Whether global access is enabled.
     */
    globalAccessEnabled: boolean;
    /**
     * Current status of the Private Service Connect configuration.
     */
    status: outputs.GetClusterGcpPrivateServiceConnectStatus;
}
export interface GetClusterGcpPrivateServiceConnectConsumerAcceptList {
    /**
     * Either the GCP project number or its alphanumeric ID.
     */
    source: string;
}
export interface GetClusterGcpPrivateServiceConnectStatus {
    /**
     * List of connected endpoints.
     */
    connectedEndpoints: outputs.GetClusterGcpPrivateServiceConnectStatusConnectedEndpoint[];
    /**
     * When the Private Service Connect service was created.
     */
    createdAt: string;
    /**
     * When the Private Service Connect service was deleted.
     */
    deletedAt: string;
    /**
     * DNS A records for the service.
     */
    dnsARecords: string[];
    /**
     * Base port for Kafka API nodes.
     */
    kafkaApiNodeBasePort: number;
    /**
     * Port for Kafka API seed brokers.
     */
    kafkaApiSeedPort: number;
    /**
     * Base port for HTTP proxy nodes.
     */
    redpandaProxyNodeBasePort: number;
    /**
     * Port for HTTP proxy.
     */
    redpandaProxySeedPort: number;
    /**
     * Port for Schema Registry.
     */
    schemaRegistrySeedPort: number;
    /**
     * Hostname for the seed brokers.
     */
    seedHostname: string;
    /**
     * The service attachment identifier.
     */
    serviceAttachment: string;
}
export interface GetClusterGcpPrivateServiceConnectStatusConnectedEndpoint {
    /**
     * The connection ID.
     */
    connectionId: string;
    /**
     * The consumer network.
     */
    consumerNetwork: string;
    /**
     * The endpoint address.
     */
    endpoint: string;
    /**
     * Status of the endpoint connection.
     */
    status: string;
}
export interface GetClusterHttpProxy {
    /**
     * All HTTP proxy endpoint variants.
     */
    allUrls: outputs.GetClusterHttpProxyAllUrls;
    /**
     * mTLS configuration.
     */
    mtls: outputs.GetClusterHttpProxyMtls;
    /**
     * SASL configuration.
     */
    sasl: outputs.GetClusterHttpProxySasl;
    /**
     * The HTTP Proxy URL.
     */
    url: string;
}
export interface GetClusterHttpProxyAllUrls {
    /**
     * mTLS endpoint.
     */
    mtls: string;
    /**
     * Private link mTLS endpoint.
     */
    privateLinkMtls: string;
    /**
     * Private link SASL endpoint.
     */
    privateLinkSasl: string;
    /**
     * SASL endpoint.
     */
    sasl: string;
}
export interface GetClusterHttpProxyMtls {
    /**
     * CA certificate in PEM format.
     */
    caCertificatesPems: string[];
    /**
     * Whether mTLS is enabled.
     */
    enabled: boolean;
    /**
     * Principal mapping rules for mTLS authentication.
     */
    principalMappingRules: string[];
}
export interface GetClusterHttpProxySasl {
    /**
     * Whether SASL is enabled.
     */
    enabled: boolean;
}
export interface GetClusterKafkaApi {
    /**
     * All seed broker endpoint variants.
     */
    allSeedBrokers: outputs.GetClusterKafkaApiAllSeedBrokers;
    /**
     * mTLS configuration.
     */
    mtls: outputs.GetClusterKafkaApiMtls;
    /**
     * SASL configuration.
     */
    sasl: outputs.GetClusterKafkaApiSasl;
    /**
     * List of Kafka broker addresses.
     */
    seedBrokers: string[];
}
export interface GetClusterKafkaApiAllSeedBrokers {
    /**
     * mTLS endpoint.
     */
    mtls: string;
    /**
     * Private link mTLS endpoint.
     */
    privateLinkMtls: string;
    /**
     * Private link SASL endpoint.
     */
    privateLinkSasl: string;
    /**
     * SASL endpoint.
     */
    sasl: string;
}
export interface GetClusterKafkaApiMtls {
    /**
     * CA certificate in PEM format.
     */
    caCertificatesPems: string[];
    /**
     * Whether mTLS is enabled.
     */
    enabled: boolean;
    /**
     * Principal mapping rules for mTLS authentication.
     */
    principalMappingRules: string[];
}
export interface GetClusterKafkaApiSasl {
    /**
     * Whether SASL is enabled.
     */
    enabled: boolean;
}
export interface GetClusterKafkaConnect {
    /**
     * Whether Kafka Connect is enabled.
     */
    enabled: boolean;
}
export interface GetClusterMaintenanceWindowConfig {
    /**
     * If true, maintenance can occur at any time.
     */
    anytime: boolean;
    dayHour: outputs.GetClusterMaintenanceWindowConfigDayHour;
    /**
     * If true, maintenance window is unspecified.
     */
    unspecified: boolean;
}
export interface GetClusterMaintenanceWindowConfigDayHour {
    /**
     * Day of week.
     */
    dayOfWeek: string;
    /**
     * Hour of day.
     */
    hourOfDay: number;
}
export interface GetClusterPrometheus {
    /**
     * The Prometheus metrics endpoint URL.
     */
    url: string;
}
export interface GetClusterRedpandaConsole {
    /**
     * The Redpanda Console URL.
     */
    url: string;
}
export interface GetClusterSchemaRegistry {
    /**
     * All schema registry endpoint variants.
     */
    allUrls: outputs.GetClusterSchemaRegistryAllUrls;
    /**
     * mTLS configuration.
     */
    mtls: outputs.GetClusterSchemaRegistryMtls;
    /**
     * The Schema Registry URL.
     */
    url: string;
}
export interface GetClusterSchemaRegistryAllUrls {
    /**
     * mTLS endpoint.
     */
    mtls: string;
    /**
     * Private link mTLS endpoint.
     */
    privateLinkMtls: string;
    /**
     * Private link SASL endpoint.
     */
    privateLinkSasl: string;
    /**
     * SASL endpoint.
     */
    sasl: string;
}
export interface GetClusterSchemaRegistryMtls {
    /**
     * CA certificate in PEM format.
     */
    caCertificatesPems: string[];
    /**
     * Whether mTLS is enabled.
     */
    enabled: boolean;
    /**
     * Principal mapping rules for mTLS authentication.
     */
    principalMappingRules: string[];
}
export interface GetClusterStateDescription {
    /**
     * Error code if cluster is in error state.
     */
    code: number;
    /**
     * Detailed error message if cluster is in error state.
     */
    message: string;
}
export interface GetClusterTimeouts {
    /**
     * A string that can be [parsed as a duration](https://pkg.go.dev/time#ParseDuration) consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours).
     */
    read?: string;
}
export interface GetNetworkCustomerManagedResources {
    aws: outputs.GetNetworkCustomerManagedResourcesAws;
    gcp: outputs.GetNetworkCustomerManagedResourcesGcp;
}
export interface GetNetworkCustomerManagedResourcesAws {
    dynamodbTable: outputs.GetNetworkCustomerManagedResourcesAwsDynamodbTable;
    managementBucket: outputs.GetNetworkCustomerManagedResourcesAwsManagementBucket;
    privateSubnets: outputs.GetNetworkCustomerManagedResourcesAwsPrivateSubnets;
    vpc: outputs.GetNetworkCustomerManagedResourcesAwsVpc;
}
export interface GetNetworkCustomerManagedResourcesAwsDynamodbTable {
    /**
     * AWS DynamoDB table identifier
     */
    arn: string;
}
export interface GetNetworkCustomerManagedResourcesAwsManagementBucket {
    /**
     * AWS storage bucket identifier
     */
    arn: string;
}
export interface GetNetworkCustomerManagedResourcesAwsPrivateSubnets {
    /**
     * AWS private subnet identifiers
     */
    arns: string[];
}
export interface GetNetworkCustomerManagedResourcesAwsVpc {
    /**
     * AWS VPC identifier
     */
    arn: string;
}
export interface GetNetworkCustomerManagedResourcesGcp {
    managementBucket: outputs.GetNetworkCustomerManagedResourcesGcpManagementBucket;
    /**
     * Name of user-created network where the Redpanda cluster is deployed
     */
    networkName: string;
    /**
     * GCP project ID where the network is created
     */
    networkProjectId: string;
}
export interface GetNetworkCustomerManagedResourcesGcpManagementBucket {
    /**
     * GCP storage bucket name for storing the state of Redpanda cluster deployment
     */
    name: string;
}
export interface GetRegionsRegion {
    /**
     * Name of the region
     */
    name: string;
    /**
     * Zones available in the region
     */
    zones: string[];
}
export interface GetSchemaReference {
    /**
     * The name of the referenced schema.
     */
    name: string;
    /**
     * The subject of the referenced schema.
     */
    subject: string;
    /**
     * The version of the referenced schema.
     */
    version: number;
}
export interface GetServerlessRegionsServerlessRegion {
    /**
     * Cloud provider where the serverless regions exist
     */
    cloudProvider: string;
    /**
     * Name of the serverless region
     */
    name: string;
    placement: outputs.GetServerlessRegionsServerlessRegionPlacement;
    /**
     * Time zone of the serverless region
     */
    timeZone: string;
}
export interface GetServerlessRegionsServerlessRegionPlacement {
    /**
     * Region available
     */
    enabled: boolean;
}
export interface GetThroughputTiersThroughputTier {
    /**
     * Cloud provider where the Throughput Tier is available
     */
    cloudProvider: string;
    /**
     * Display name of the Throughput Tier
     */
    displayName: string;
    /**
     * Unique name of the Throughput Tier
     */
    name: string;
}
export interface NetworkCustomerManagedResources {
    aws?: outputs.NetworkCustomerManagedResourcesAws;
    gcp?: outputs.NetworkCustomerManagedResourcesGcp;
}
export interface NetworkCustomerManagedResourcesAws {
    dynamodbTable: outputs.NetworkCustomerManagedResourcesAwsDynamodbTable;
    managementBucket: outputs.NetworkCustomerManagedResourcesAwsManagementBucket;
    privateSubnets: outputs.NetworkCustomerManagedResourcesAwsPrivateSubnets;
    vpc: outputs.NetworkCustomerManagedResourcesAwsVpc;
}
export interface NetworkCustomerManagedResourcesAwsDynamodbTable {
    /**
     * AWS DynamoDB table identifier
     */
    arn: string;
}
export interface NetworkCustomerManagedResourcesAwsManagementBucket {
    /**
     * AWS storage bucket identifier
     */
    arn: string;
}
export interface NetworkCustomerManagedResourcesAwsPrivateSubnets {
    /**
     * AWS private subnet identifiers
     */
    arns: string[];
}
export interface NetworkCustomerManagedResourcesAwsVpc {
    /**
     * AWS VPC identifier
     */
    arn: string;
}
export interface NetworkCustomerManagedResourcesGcp {
    managementBucket: outputs.NetworkCustomerManagedResourcesGcpManagementBucket;
    /**
     * Name of user-created network where the Redpanda cluster is deployed
     */
    networkName: string;
    /**
     * GCP project ID where the network is created
     */
    networkProjectId: string;
}
export interface NetworkCustomerManagedResourcesGcpManagementBucket {
    /**
     * GCP storage bucket name for storing the state of Redpanda cluster deployment
     */
    name: string;
}
export interface NetworkTimeouts {
    /**
     * A string that can be [parsed as a duration](https://pkg.go.dev/time#ParseDuration) consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours).
     */
    create?: string;
    /**
     * A string that can be [parsed as a duration](https://pkg.go.dev/time#ParseDuration) consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Setting a timeout for a Delete operation is only applicable if changes are saved into state before the destroy operation occurs.
     */
    delete?: string;
}
export interface PipelineResources {
    /**
     * Amount of CPU to allocate for the pipeline.
     */
    cpuShares?: string;
    /**
     * Amount of memory to allocate for the pipeline.
     */
    memoryShares?: string;
}
export interface PipelineServiceAccount {
    /**
     * The client ID for the service account.
     */
    clientId: string;
    /**
     * **NOTE:** This field is write-only and its value will not be updated in state as part of read operations.
     */
    clientSecret: string;
    /**
     * Version number for client_secret. Increment to trigger a secret update.
     */
    secretVersion?: number;
}
export interface PipelineStatus {
    /**
     * Error message if the pipeline is in an error state.
     */
    error: string;
}
export interface PipelineTimeouts {
    /**
     * A string that can be [parsed as a duration](https://pkg.go.dev/time#ParseDuration) consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours).
     */
    create?: string;
    /**
     * A string that can be [parsed as a duration](https://pkg.go.dev/time#ParseDuration) consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Setting a timeout for a Delete operation is only applicable if changes are saved into state before the destroy operation occurs.
     */
    delete?: string;
    /**
     * A string that can be [parsed as a duration](https://pkg.go.dev/time#ParseDuration) consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours).
     */
    update?: string;
}
export interface SchemaReference {
    /**
     * The name of the referenced schema.
     */
    name: string;
    /**
     * The subject of the referenced schema.
     */
    subject: string;
    /**
     * The version of the referenced schema.
     */
    version: number;
}
export interface ServerlessClusterDataplaneApi {
    /**
     * Private Dataplane API URL
     */
    privateUrl: string;
    /**
     * Public Dataplane API URL
     */
    url: string;
}
export interface ServerlessClusterKafkaApi {
    /**
     * Private Kafka API seed brokers (bootstrap servers)
     */
    privateSeedBrokers: string[];
    /**
     * Public Kafka API seed brokers (bootstrap servers)
     */
    seedBrokers: string[];
}
export interface ServerlessClusterNetworkingConfig {
    /**
     * Private network state. Valid values: STATE_UNSPECIFIED, STATE_DISABLED, STATE_ENABLED
     */
    private: string;
    /**
     * Public network state. Valid values: STATE_UNSPECIFIED, STATE_DISABLED, STATE_ENABLED
     */
    public: string;
}
export interface ServerlessClusterPlannedDeletion {
    /**
     * Timestamp after which the cluster will be deleted.
     */
    deleteAfter: string;
    /**
     * Reason for the planned deletion.
     */
    reason: string;
}
export interface ServerlessClusterPrometheus {
    /**
     * Private Prometheus metrics URL
     */
    privateUrl: string;
    /**
     * Public Prometheus metrics URL
     */
    url: string;
}
export interface ServerlessClusterSchemaRegistry {
    /**
     * Private Schema Registry URL
     */
    privateUrl: string;
    /**
     * Public Schema Registry URL
     */
    url: string;
}
export interface ServerlessPrivateLinkCloudProviderConfig {
    /**
     * AWS-specific configuration. Required when<span pulumi-lang-nodejs=" cloudProvider " pulumi-lang-dotnet=" CloudProvider " pulumi-lang-go=" cloudProvider " pulumi-lang-python=" cloud_provider " pulumi-lang-yaml=" cloudProvider " pulumi-lang-java=" cloudProvider "> cloud_provider </span>is 'aws'.
     */
    aws?: outputs.ServerlessPrivateLinkCloudProviderConfigAws;
}
export interface ServerlessPrivateLinkCloudProviderConfigAws {
    /**
     * AWS principals (ARNs) allowed to connect to the private link endpoint
     */
    allowedPrincipals: string[];
}
export interface ServerlessPrivateLinkStatus {
    /**
     * AWS-specific status information
     */
    aws: outputs.ServerlessPrivateLinkStatusAws;
}
export interface ServerlessPrivateLinkStatusAws {
    /**
     * Availability zones where the private link endpoint service is available
     */
    availabilityZones: string[];
    /**
     * VPC endpoint service name for connecting to the private link
     */
    vpcEndpointServiceName: string;
}
export interface TopicReplicaAssignment {
    /**
     * A partition to create.
     */
    partitionId: number;
    /**
     * The broker IDs the partition replicas are assigned to.
     */
    replicaIds: number[];
}
