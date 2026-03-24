import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class Service extends pulumi.CustomResource {
    /**
     * Get an existing Service resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param state Any extra arguments used during the lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    static get(name: string, id: pulumi.Input<pulumi.ID>, state?: ServiceState, opts?: pulumi.CustomResourceOptions): Service;
    /**
     * Returns true if the given object is an instance of Service.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is Service;
    /**
     * Configuration of service backup settings.
     */
    readonly backupConfiguration: pulumi.Output<outputs.ServiceBackupConfiguration>;
    /**
     * ID of the backup to restore when creating new service. If specified, the service will be created as a restore operation
     */
    readonly backupId: pulumi.Output<string | undefined>;
    /**
     * BYOC ID related to the cloud provider account you want to create this service into.
     */
    readonly byocId: pulumi.Output<string | undefined>;
    /**
     * Cloud provider ('aws', 'gcp', or 'azure') in which the service is deployed in.
     */
    readonly cloudProvider: pulumi.Output<string>;
    /**
     * Compliance type of the service. Can be 'hipaa', 'pci'. Required for organizations that wish to deploy their services in the hipaa/pci compliant environment. NOTE: hipaa/pci compliance should be enabled for your ClickHouse organization before using this field.
     */
    readonly complianceType: pulumi.Output<string | undefined>;
    /**
     * Double SHA1 hash of password for connecting with the MySQL protocol. Cannot be specified if <span pulumi-lang-nodejs="`password`" pulumi-lang-dotnet="`Password`" pulumi-lang-go="`password`" pulumi-lang-python="`password`" pulumi-lang-yaml="`password`" pulumi-lang-java="`password`">`password`</span> or <span pulumi-lang-nodejs="`passwordWo`" pulumi-lang-dotnet="`PasswordWo`" pulumi-lang-go="`passwordWo`" pulumi-lang-python="`password_wo`" pulumi-lang-yaml="`passwordWo`" pulumi-lang-java="`passwordWo`">`password_wo`</span> is specified.
     */
    readonly doubleSha1PasswordHash: pulumi.Output<string | undefined>;
    /**
     * Enable core dumps for the service.
     */
    readonly enableCoreDumps: pulumi.Output<boolean>;
    /**
     * Custom role identifier ARN.
     */
    readonly encryptionAssumedRoleIdentifier: pulumi.Output<string | undefined>;
    /**
     * Custom encryption key ARN.
     */
    readonly encryptionKey: pulumi.Output<string>;
    /**
     * Allow to enable and configure additional endpoints (read protocols) to expose on the ClickHouse service.
     */
    readonly endpoints: pulumi.Output<outputs.ServiceEndpoints>;
    /**
     * IAM role used for accessing objects in s3.
     */
    readonly iamRole: pulumi.Output<string>;
    /**
     * When set to true the service is allowed to scale down to zero when idle.
     */
    readonly idleScaling: pulumi.Output<boolean>;
    /**
     * Set minimum idling timeout (in minutes). Must be greater than or equal to 5 minutes. Must be set if<span pulumi-lang-nodejs=" idleScaling " pulumi-lang-dotnet=" IdleScaling " pulumi-lang-go=" idleScaling " pulumi-lang-python=" idle_scaling " pulumi-lang-yaml=" idleScaling " pulumi-lang-java=" idleScaling "> idle_scaling </span>is enabled.
     */
    readonly idleTimeoutMinutes: pulumi.Output<number>;
    /**
     * List of IP addresses allowed to access the service.
     */
    readonly ipAccesses: pulumi.Output<outputs.ServiceIpAccess[]>;
    /**
     * If true, it indicates this is a primary service using its own data. If false it means this service is a secondary service, thus using data from a warehouse.
     */
    readonly isPrimary: pulumi.Output<boolean>;
    /**
     * Maximum memory of a single replica during auto-scaling in GiB.
     */
    readonly maxReplicaMemoryGb: pulumi.Output<number>;
    /**
     * Maximum total memory of all workers during auto-scaling in GiB.
     *
     * @deprecated Deprecated
     */
    readonly maxTotalMemoryGb: pulumi.Output<number | undefined>;
    /**
     * Minimum memory of a single replica during auto-scaling in GiB.
     */
    readonly minReplicaMemoryGb: pulumi.Output<number>;
    /**
     * Minimum total memory of all workers during auto-scaling in GiB.
     *
     * @deprecated Deprecated
     */
    readonly minTotalMemoryGb: pulumi.Output<number | undefined>;
    /**
     * User defined identifier for the service.
     */
    readonly name: pulumi.Output<string>;
    /**
     * Number of replicas for the service.
     */
    readonly numReplicas: pulumi.Output<number>;
    /**
     * Password for the default user. One of either <span pulumi-lang-nodejs="`password`" pulumi-lang-dotnet="`Password`" pulumi-lang-go="`password`" pulumi-lang-python="`password`" pulumi-lang-yaml="`password`" pulumi-lang-java="`password`">`password`</span>, <span pulumi-lang-nodejs="`passwordWo`" pulumi-lang-dotnet="`PasswordWo`" pulumi-lang-go="`passwordWo`" pulumi-lang-python="`password_wo`" pulumi-lang-yaml="`passwordWo`" pulumi-lang-java="`passwordWo`">`password_wo`</span>, or <span pulumi-lang-nodejs="`passwordHash`" pulumi-lang-dotnet="`PasswordHash`" pulumi-lang-go="`passwordHash`" pulumi-lang-python="`password_hash`" pulumi-lang-yaml="`passwordHash`" pulumi-lang-java="`passwordHash`">`password_hash`</span> must be specified.
     */
    readonly password: pulumi.Output<string | undefined>;
    /**
     * SHA256 hash of password for the default user. One of either <span pulumi-lang-nodejs="`password`" pulumi-lang-dotnet="`Password`" pulumi-lang-go="`password`" pulumi-lang-python="`password`" pulumi-lang-yaml="`password`" pulumi-lang-java="`password`">`password`</span>, <span pulumi-lang-nodejs="`passwordWo`" pulumi-lang-dotnet="`PasswordWo`" pulumi-lang-go="`passwordWo`" pulumi-lang-python="`password_wo`" pulumi-lang-yaml="`passwordWo`" pulumi-lang-java="`passwordWo`">`password_wo`</span>, or <span pulumi-lang-nodejs="`passwordHash`" pulumi-lang-dotnet="`PasswordHash`" pulumi-lang-go="`passwordHash`" pulumi-lang-python="`password_hash`" pulumi-lang-yaml="`passwordHash`" pulumi-lang-java="`passwordHash`">`password_hash`</span> must be specified.
     */
    readonly passwordHash: pulumi.Output<string | undefined>;
    /**
     * **NOTE:** This field is write-only and its value will not be updated in state as part of read operations.
     */
    readonly passwordWo: pulumi.Output<string | undefined>;
    /**
     * Version number for password_wo. Increment this to trigger a password update when using password_wo.
     */
    readonly passwordWoVersion: pulumi.Output<number | undefined>;
    /**
     * Service config for private endpoints
     */
    readonly privateEndpointConfig: pulumi.Output<outputs.ServicePrivateEndpointConfig>;
    /**
     * Configuration of the query API endpoints feature.
     */
    readonly queryApiEndpoints: pulumi.Output<outputs.ServiceQueryApiEndpoints | undefined>;
    /**
     * Indicates if this service should be read only. Only allowed for secondary services, those which share data with another service (i.e. when <span pulumi-lang-nodejs="`warehouseId`" pulumi-lang-dotnet="`WarehouseId`" pulumi-lang-go="`warehouseId`" pulumi-lang-python="`warehouse_id`" pulumi-lang-yaml="`warehouseId`" pulumi-lang-java="`warehouseId`">`warehouse_id`</span> field is set).
     */
    readonly readonly: pulumi.Output<boolean>;
    /**
     * Region within the cloud provider in which the service is deployed in.
     */
    readonly region: pulumi.Output<string>;
    /**
     * Release channel to use for this service. Can be 'default', 'fast' or 'slow'.
     */
    readonly releaseChannel: pulumi.Output<string>;
    /**
     * Tags associated with the service as key-value pairs.
     */
    readonly tags: pulumi.Output<{
        [key: string]: string;
    } | undefined>;
    /**
     * Tier of the service: 'development', 'production'. Required for organizations using the Legacy ClickHouse Cloud Tiers, must be omitted for organizations using the new ClickHouse Cloud Tiers.
     */
    readonly tier: pulumi.Output<string | undefined>;
    /**
     * Configuration of the Transparent Data Encryption (TDE) feature. Requires an organization with the Enterprise plan.
     */
    readonly transparentDataEncryption: pulumi.Output<outputs.ServiceTransparentDataEncryption>;
    /**
     * Set it to the 'warehouse_id' attribute of another service to share the data with it. The service must be in the same cloud and region.
     */
    readonly warehouseId: pulumi.Output<string>;
    /**
     * Create a Service resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: ServiceArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering Service resources.
 */
export interface ServiceState {
    /**
     * Configuration of service backup settings.
     */
    backupConfiguration?: pulumi.Input<inputs.ServiceBackupConfiguration>;
    /**
     * ID of the backup to restore when creating new service. If specified, the service will be created as a restore operation
     */
    backupId?: pulumi.Input<string>;
    /**
     * BYOC ID related to the cloud provider account you want to create this service into.
     */
    byocId?: pulumi.Input<string>;
    /**
     * Cloud provider ('aws', 'gcp', or 'azure') in which the service is deployed in.
     */
    cloudProvider?: pulumi.Input<string>;
    /**
     * Compliance type of the service. Can be 'hipaa', 'pci'. Required for organizations that wish to deploy their services in the hipaa/pci compliant environment. NOTE: hipaa/pci compliance should be enabled for your ClickHouse organization before using this field.
     */
    complianceType?: pulumi.Input<string>;
    /**
     * Double SHA1 hash of password for connecting with the MySQL protocol. Cannot be specified if <span pulumi-lang-nodejs="`password`" pulumi-lang-dotnet="`Password`" pulumi-lang-go="`password`" pulumi-lang-python="`password`" pulumi-lang-yaml="`password`" pulumi-lang-java="`password`">`password`</span> or <span pulumi-lang-nodejs="`passwordWo`" pulumi-lang-dotnet="`PasswordWo`" pulumi-lang-go="`passwordWo`" pulumi-lang-python="`password_wo`" pulumi-lang-yaml="`passwordWo`" pulumi-lang-java="`passwordWo`">`password_wo`</span> is specified.
     */
    doubleSha1PasswordHash?: pulumi.Input<string>;
    /**
     * Enable core dumps for the service.
     */
    enableCoreDumps?: pulumi.Input<boolean>;
    /**
     * Custom role identifier ARN.
     */
    encryptionAssumedRoleIdentifier?: pulumi.Input<string>;
    /**
     * Custom encryption key ARN.
     */
    encryptionKey?: pulumi.Input<string>;
    /**
     * Allow to enable and configure additional endpoints (read protocols) to expose on the ClickHouse service.
     */
    endpoints?: pulumi.Input<inputs.ServiceEndpoints>;
    /**
     * IAM role used for accessing objects in s3.
     */
    iamRole?: pulumi.Input<string>;
    /**
     * When set to true the service is allowed to scale down to zero when idle.
     */
    idleScaling?: pulumi.Input<boolean>;
    /**
     * Set minimum idling timeout (in minutes). Must be greater than or equal to 5 minutes. Must be set if<span pulumi-lang-nodejs=" idleScaling " pulumi-lang-dotnet=" IdleScaling " pulumi-lang-go=" idleScaling " pulumi-lang-python=" idle_scaling " pulumi-lang-yaml=" idleScaling " pulumi-lang-java=" idleScaling "> idle_scaling </span>is enabled.
     */
    idleTimeoutMinutes?: pulumi.Input<number>;
    /**
     * List of IP addresses allowed to access the service.
     */
    ipAccesses?: pulumi.Input<pulumi.Input<inputs.ServiceIpAccess>[]>;
    /**
     * If true, it indicates this is a primary service using its own data. If false it means this service is a secondary service, thus using data from a warehouse.
     */
    isPrimary?: pulumi.Input<boolean>;
    /**
     * Maximum memory of a single replica during auto-scaling in GiB.
     */
    maxReplicaMemoryGb?: pulumi.Input<number>;
    /**
     * Maximum total memory of all workers during auto-scaling in GiB.
     *
     * @deprecated Deprecated
     */
    maxTotalMemoryGb?: pulumi.Input<number>;
    /**
     * Minimum memory of a single replica during auto-scaling in GiB.
     */
    minReplicaMemoryGb?: pulumi.Input<number>;
    /**
     * Minimum total memory of all workers during auto-scaling in GiB.
     *
     * @deprecated Deprecated
     */
    minTotalMemoryGb?: pulumi.Input<number>;
    /**
     * User defined identifier for the service.
     */
    name?: pulumi.Input<string>;
    /**
     * Number of replicas for the service.
     */
    numReplicas?: pulumi.Input<number>;
    /**
     * Password for the default user. One of either <span pulumi-lang-nodejs="`password`" pulumi-lang-dotnet="`Password`" pulumi-lang-go="`password`" pulumi-lang-python="`password`" pulumi-lang-yaml="`password`" pulumi-lang-java="`password`">`password`</span>, <span pulumi-lang-nodejs="`passwordWo`" pulumi-lang-dotnet="`PasswordWo`" pulumi-lang-go="`passwordWo`" pulumi-lang-python="`password_wo`" pulumi-lang-yaml="`passwordWo`" pulumi-lang-java="`passwordWo`">`password_wo`</span>, or <span pulumi-lang-nodejs="`passwordHash`" pulumi-lang-dotnet="`PasswordHash`" pulumi-lang-go="`passwordHash`" pulumi-lang-python="`password_hash`" pulumi-lang-yaml="`passwordHash`" pulumi-lang-java="`passwordHash`">`password_hash`</span> must be specified.
     */
    password?: pulumi.Input<string>;
    /**
     * SHA256 hash of password for the default user. One of either <span pulumi-lang-nodejs="`password`" pulumi-lang-dotnet="`Password`" pulumi-lang-go="`password`" pulumi-lang-python="`password`" pulumi-lang-yaml="`password`" pulumi-lang-java="`password`">`password`</span>, <span pulumi-lang-nodejs="`passwordWo`" pulumi-lang-dotnet="`PasswordWo`" pulumi-lang-go="`passwordWo`" pulumi-lang-python="`password_wo`" pulumi-lang-yaml="`passwordWo`" pulumi-lang-java="`passwordWo`">`password_wo`</span>, or <span pulumi-lang-nodejs="`passwordHash`" pulumi-lang-dotnet="`PasswordHash`" pulumi-lang-go="`passwordHash`" pulumi-lang-python="`password_hash`" pulumi-lang-yaml="`passwordHash`" pulumi-lang-java="`passwordHash`">`password_hash`</span> must be specified.
     */
    passwordHash?: pulumi.Input<string>;
    /**
     * **NOTE:** This field is write-only and its value will not be updated in state as part of read operations.
     */
    passwordWo?: pulumi.Input<string>;
    /**
     * Version number for password_wo. Increment this to trigger a password update when using password_wo.
     */
    passwordWoVersion?: pulumi.Input<number>;
    /**
     * Service config for private endpoints
     */
    privateEndpointConfig?: pulumi.Input<inputs.ServicePrivateEndpointConfig>;
    /**
     * Configuration of the query API endpoints feature.
     */
    queryApiEndpoints?: pulumi.Input<inputs.ServiceQueryApiEndpoints>;
    /**
     * Indicates if this service should be read only. Only allowed for secondary services, those which share data with another service (i.e. when <span pulumi-lang-nodejs="`warehouseId`" pulumi-lang-dotnet="`WarehouseId`" pulumi-lang-go="`warehouseId`" pulumi-lang-python="`warehouse_id`" pulumi-lang-yaml="`warehouseId`" pulumi-lang-java="`warehouseId`">`warehouse_id`</span> field is set).
     */
    readonly?: pulumi.Input<boolean>;
    /**
     * Region within the cloud provider in which the service is deployed in.
     */
    region?: pulumi.Input<string>;
    /**
     * Release channel to use for this service. Can be 'default', 'fast' or 'slow'.
     */
    releaseChannel?: pulumi.Input<string>;
    /**
     * Tags associated with the service as key-value pairs.
     */
    tags?: pulumi.Input<{
        [key: string]: pulumi.Input<string>;
    }>;
    /**
     * Tier of the service: 'development', 'production'. Required for organizations using the Legacy ClickHouse Cloud Tiers, must be omitted for organizations using the new ClickHouse Cloud Tiers.
     */
    tier?: pulumi.Input<string>;
    /**
     * Configuration of the Transparent Data Encryption (TDE) feature. Requires an organization with the Enterprise plan.
     */
    transparentDataEncryption?: pulumi.Input<inputs.ServiceTransparentDataEncryption>;
    /**
     * Set it to the 'warehouse_id' attribute of another service to share the data with it. The service must be in the same cloud and region.
     */
    warehouseId?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a Service resource.
 */
export interface ServiceArgs {
    /**
     * Configuration of service backup settings.
     */
    backupConfiguration?: pulumi.Input<inputs.ServiceBackupConfiguration>;
    /**
     * ID of the backup to restore when creating new service. If specified, the service will be created as a restore operation
     */
    backupId?: pulumi.Input<string>;
    /**
     * BYOC ID related to the cloud provider account you want to create this service into.
     */
    byocId?: pulumi.Input<string>;
    /**
     * Cloud provider ('aws', 'gcp', or 'azure') in which the service is deployed in.
     */
    cloudProvider: pulumi.Input<string>;
    /**
     * Compliance type of the service. Can be 'hipaa', 'pci'. Required for organizations that wish to deploy their services in the hipaa/pci compliant environment. NOTE: hipaa/pci compliance should be enabled for your ClickHouse organization before using this field.
     */
    complianceType?: pulumi.Input<string>;
    /**
     * Double SHA1 hash of password for connecting with the MySQL protocol. Cannot be specified if <span pulumi-lang-nodejs="`password`" pulumi-lang-dotnet="`Password`" pulumi-lang-go="`password`" pulumi-lang-python="`password`" pulumi-lang-yaml="`password`" pulumi-lang-java="`password`">`password`</span> or <span pulumi-lang-nodejs="`passwordWo`" pulumi-lang-dotnet="`PasswordWo`" pulumi-lang-go="`passwordWo`" pulumi-lang-python="`password_wo`" pulumi-lang-yaml="`passwordWo`" pulumi-lang-java="`passwordWo`">`password_wo`</span> is specified.
     */
    doubleSha1PasswordHash?: pulumi.Input<string>;
    /**
     * Enable core dumps for the service.
     */
    enableCoreDumps?: pulumi.Input<boolean>;
    /**
     * Custom role identifier ARN.
     */
    encryptionAssumedRoleIdentifier?: pulumi.Input<string>;
    /**
     * Custom encryption key ARN.
     */
    encryptionKey?: pulumi.Input<string>;
    /**
     * Allow to enable and configure additional endpoints (read protocols) to expose on the ClickHouse service.
     */
    endpoints?: pulumi.Input<inputs.ServiceEndpoints>;
    /**
     * When set to true the service is allowed to scale down to zero when idle.
     */
    idleScaling?: pulumi.Input<boolean>;
    /**
     * Set minimum idling timeout (in minutes). Must be greater than or equal to 5 minutes. Must be set if<span pulumi-lang-nodejs=" idleScaling " pulumi-lang-dotnet=" IdleScaling " pulumi-lang-go=" idleScaling " pulumi-lang-python=" idle_scaling " pulumi-lang-yaml=" idleScaling " pulumi-lang-java=" idleScaling "> idle_scaling </span>is enabled.
     */
    idleTimeoutMinutes?: pulumi.Input<number>;
    /**
     * List of IP addresses allowed to access the service.
     */
    ipAccesses: pulumi.Input<pulumi.Input<inputs.ServiceIpAccess>[]>;
    /**
     * Maximum memory of a single replica during auto-scaling in GiB.
     */
    maxReplicaMemoryGb?: pulumi.Input<number>;
    /**
     * Maximum total memory of all workers during auto-scaling in GiB.
     *
     * @deprecated Deprecated
     */
    maxTotalMemoryGb?: pulumi.Input<number>;
    /**
     * Minimum memory of a single replica during auto-scaling in GiB.
     */
    minReplicaMemoryGb?: pulumi.Input<number>;
    /**
     * Minimum total memory of all workers during auto-scaling in GiB.
     *
     * @deprecated Deprecated
     */
    minTotalMemoryGb?: pulumi.Input<number>;
    /**
     * User defined identifier for the service.
     */
    name?: pulumi.Input<string>;
    /**
     * Number of replicas for the service.
     */
    numReplicas?: pulumi.Input<number>;
    /**
     * Password for the default user. One of either <span pulumi-lang-nodejs="`password`" pulumi-lang-dotnet="`Password`" pulumi-lang-go="`password`" pulumi-lang-python="`password`" pulumi-lang-yaml="`password`" pulumi-lang-java="`password`">`password`</span>, <span pulumi-lang-nodejs="`passwordWo`" pulumi-lang-dotnet="`PasswordWo`" pulumi-lang-go="`passwordWo`" pulumi-lang-python="`password_wo`" pulumi-lang-yaml="`passwordWo`" pulumi-lang-java="`passwordWo`">`password_wo`</span>, or <span pulumi-lang-nodejs="`passwordHash`" pulumi-lang-dotnet="`PasswordHash`" pulumi-lang-go="`passwordHash`" pulumi-lang-python="`password_hash`" pulumi-lang-yaml="`passwordHash`" pulumi-lang-java="`passwordHash`">`password_hash`</span> must be specified.
     */
    password?: pulumi.Input<string>;
    /**
     * SHA256 hash of password for the default user. One of either <span pulumi-lang-nodejs="`password`" pulumi-lang-dotnet="`Password`" pulumi-lang-go="`password`" pulumi-lang-python="`password`" pulumi-lang-yaml="`password`" pulumi-lang-java="`password`">`password`</span>, <span pulumi-lang-nodejs="`passwordWo`" pulumi-lang-dotnet="`PasswordWo`" pulumi-lang-go="`passwordWo`" pulumi-lang-python="`password_wo`" pulumi-lang-yaml="`passwordWo`" pulumi-lang-java="`passwordWo`">`password_wo`</span>, or <span pulumi-lang-nodejs="`passwordHash`" pulumi-lang-dotnet="`PasswordHash`" pulumi-lang-go="`passwordHash`" pulumi-lang-python="`password_hash`" pulumi-lang-yaml="`passwordHash`" pulumi-lang-java="`passwordHash`">`password_hash`</span> must be specified.
     */
    passwordHash?: pulumi.Input<string>;
    /**
     * **NOTE:** This field is write-only and its value will not be updated in state as part of read operations.
     */
    passwordWo?: pulumi.Input<string>;
    /**
     * Version number for password_wo. Increment this to trigger a password update when using password_wo.
     */
    passwordWoVersion?: pulumi.Input<number>;
    /**
     * Configuration of the query API endpoints feature.
     */
    queryApiEndpoints?: pulumi.Input<inputs.ServiceQueryApiEndpoints>;
    /**
     * Indicates if this service should be read only. Only allowed for secondary services, those which share data with another service (i.e. when <span pulumi-lang-nodejs="`warehouseId`" pulumi-lang-dotnet="`WarehouseId`" pulumi-lang-go="`warehouseId`" pulumi-lang-python="`warehouse_id`" pulumi-lang-yaml="`warehouseId`" pulumi-lang-java="`warehouseId`">`warehouse_id`</span> field is set).
     */
    readonly?: pulumi.Input<boolean>;
    /**
     * Region within the cloud provider in which the service is deployed in.
     */
    region: pulumi.Input<string>;
    /**
     * Release channel to use for this service. Can be 'default', 'fast' or 'slow'.
     */
    releaseChannel?: pulumi.Input<string>;
    /**
     * Tags associated with the service as key-value pairs.
     */
    tags?: pulumi.Input<{
        [key: string]: pulumi.Input<string>;
    }>;
    /**
     * Tier of the service: 'development', 'production'. Required for organizations using the Legacy ClickHouse Cloud Tiers, must be omitted for organizations using the new ClickHouse Cloud Tiers.
     */
    tier?: pulumi.Input<string>;
    /**
     * Configuration of the Transparent Data Encryption (TDE) feature. Requires an organization with the Enterprise plan.
     */
    transparentDataEncryption?: pulumi.Input<inputs.ServiceTransparentDataEncryption>;
    /**
     * Set it to the 'warehouse_id' attribute of another service to share the data with it. The service must be in the same cloud and region.
     */
    warehouseId?: pulumi.Input<string>;
}
