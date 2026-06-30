import * as pulumi from "@pulumi/pulumi";
export declare class SchemaRegistryAcl extends pulumi.CustomResource {
    /**
     * Get an existing SchemaRegistryAcl resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param state Any extra arguments used during the lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    static get(name: string, id: pulumi.Input<pulumi.ID>, state?: SchemaRegistryAclState, opts?: pulumi.CustomResourceOptions): SchemaRegistryAcl;
    /**
     * Returns true if the given object is an instance of SchemaRegistryAcl.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is SchemaRegistryAcl;
    /**
     * When set to true, allows the resource to be removed from state even if deletion fails due to permission errors
     */
    readonly allowDeletion: pulumi.Output<boolean>;
    /**
     * The ID of the cluster where the Schema Registry ACL will be created
     */
    readonly clusterId: pulumi.Output<string>;
    /**
     * The host address to use for this ACL. Use '*' for wildcard
     */
    readonly host: pulumi.Output<string>;
    /**
     * The operation type that shall be allowed or denied: ALL, READ, WRITE, DELETE, DESCRIBE, DESCRIBE_CONFIGS, ALTER, ALTER_CONFIGS
     */
    readonly operation: pulumi.Output<string>;
    /**
     * Password for authentication. Deprecated: use<span pulumi-lang-nodejs=" passwordWo " pulumi-lang-dotnet=" PasswordWo " pulumi-lang-go=" passwordWo " pulumi-lang-python=" password_wo " pulumi-lang-yaml=" passwordWo " pulumi-lang-java=" passwordWo "> password_wo </span>instead. Can be set via REDPANDA_SR_PASSWORD environment variable
     *
     * @deprecated Deprecated
     */
    readonly password: pulumi.Output<string | undefined>;
    /**
     * **NOTE:** This field is write-only and its value will not be updated in state as part of read operations.
     */
    readonly passwordWo: pulumi.Output<string | undefined>;
    /**
     * Version number for password_wo. Increment this value to trigger a password update when using password_wo.
     */
    readonly passwordWoVersion: pulumi.Output<number | undefined>;
    /**
     * The pattern type of the resource: LITERAL or PREFIXED
     */
    readonly patternType: pulumi.Output<string>;
    /**
     * The permission type: ALLOW or DENY
     */
    readonly permission: pulumi.Output<string>;
    /**
     * The principal to apply this ACL for (e.g., User:alice or RedpandaRole:admin)
     */
    readonly principal: pulumi.Output<string>;
    /**
     * The name of the resource this ACL entry will be on. Use '*' for wildcard
     */
    readonly resourceName: pulumi.Output<string>;
    /**
     * The type of the resource: SUBJECT or REGISTRY
     */
    readonly resourceType: pulumi.Output<string>;
    /**
     * Username for authentication. Can be set via REDPANDA_SR_USERNAME environment variable
     */
    readonly username: pulumi.Output<string | undefined>;
    /**
     * Create a SchemaRegistryAcl resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: SchemaRegistryAclArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering SchemaRegistryAcl resources.
 */
export interface SchemaRegistryAclState {
    /**
     * When set to true, allows the resource to be removed from state even if deletion fails due to permission errors
     */
    allowDeletion?: pulumi.Input<boolean>;
    /**
     * The ID of the cluster where the Schema Registry ACL will be created
     */
    clusterId?: pulumi.Input<string>;
    /**
     * The host address to use for this ACL. Use '*' for wildcard
     */
    host?: pulumi.Input<string>;
    /**
     * The operation type that shall be allowed or denied: ALL, READ, WRITE, DELETE, DESCRIBE, DESCRIBE_CONFIGS, ALTER, ALTER_CONFIGS
     */
    operation?: pulumi.Input<string>;
    /**
     * Password for authentication. Deprecated: use<span pulumi-lang-nodejs=" passwordWo " pulumi-lang-dotnet=" PasswordWo " pulumi-lang-go=" passwordWo " pulumi-lang-python=" password_wo " pulumi-lang-yaml=" passwordWo " pulumi-lang-java=" passwordWo "> password_wo </span>instead. Can be set via REDPANDA_SR_PASSWORD environment variable
     *
     * @deprecated Deprecated
     */
    password?: pulumi.Input<string>;
    /**
     * **NOTE:** This field is write-only and its value will not be updated in state as part of read operations.
     */
    passwordWo?: pulumi.Input<string>;
    /**
     * Version number for password_wo. Increment this value to trigger a password update when using password_wo.
     */
    passwordWoVersion?: pulumi.Input<number>;
    /**
     * The pattern type of the resource: LITERAL or PREFIXED
     */
    patternType?: pulumi.Input<string>;
    /**
     * The permission type: ALLOW or DENY
     */
    permission?: pulumi.Input<string>;
    /**
     * The principal to apply this ACL for (e.g., User:alice or RedpandaRole:admin)
     */
    principal?: pulumi.Input<string>;
    /**
     * The name of the resource this ACL entry will be on. Use '*' for wildcard
     */
    resourceName?: pulumi.Input<string>;
    /**
     * The type of the resource: SUBJECT or REGISTRY
     */
    resourceType?: pulumi.Input<string>;
    /**
     * Username for authentication. Can be set via REDPANDA_SR_USERNAME environment variable
     */
    username?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a SchemaRegistryAcl resource.
 */
export interface SchemaRegistryAclArgs {
    /**
     * When set to true, allows the resource to be removed from state even if deletion fails due to permission errors
     */
    allowDeletion?: pulumi.Input<boolean>;
    /**
     * The ID of the cluster where the Schema Registry ACL will be created
     */
    clusterId: pulumi.Input<string>;
    /**
     * The host address to use for this ACL. Use '*' for wildcard
     */
    host: pulumi.Input<string>;
    /**
     * The operation type that shall be allowed or denied: ALL, READ, WRITE, DELETE, DESCRIBE, DESCRIBE_CONFIGS, ALTER, ALTER_CONFIGS
     */
    operation: pulumi.Input<string>;
    /**
     * Password for authentication. Deprecated: use<span pulumi-lang-nodejs=" passwordWo " pulumi-lang-dotnet=" PasswordWo " pulumi-lang-go=" passwordWo " pulumi-lang-python=" password_wo " pulumi-lang-yaml=" passwordWo " pulumi-lang-java=" passwordWo "> password_wo </span>instead. Can be set via REDPANDA_SR_PASSWORD environment variable
     *
     * @deprecated Deprecated
     */
    password?: pulumi.Input<string>;
    /**
     * **NOTE:** This field is write-only and its value will not be updated in state as part of read operations.
     */
    passwordWo?: pulumi.Input<string>;
    /**
     * Version number for password_wo. Increment this value to trigger a password update when using password_wo.
     */
    passwordWoVersion?: pulumi.Input<number>;
    /**
     * The pattern type of the resource: LITERAL or PREFIXED
     */
    patternType: pulumi.Input<string>;
    /**
     * The permission type: ALLOW or DENY
     */
    permission: pulumi.Input<string>;
    /**
     * The principal to apply this ACL for (e.g., User:alice or RedpandaRole:admin)
     */
    principal: pulumi.Input<string>;
    /**
     * The name of the resource this ACL entry will be on. Use '*' for wildcard
     */
    resourceName: pulumi.Input<string>;
    /**
     * The type of the resource: SUBJECT or REGISTRY
     */
    resourceType: pulumi.Input<string>;
    /**
     * Username for authentication. Can be set via REDPANDA_SR_USERNAME environment variable
     */
    username?: pulumi.Input<string>;
}
