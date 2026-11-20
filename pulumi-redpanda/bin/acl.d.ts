import * as pulumi from "@pulumi/pulumi";
export declare class Acl extends pulumi.CustomResource {
    /**
     * Get an existing Acl resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param state Any extra arguments used during the lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    static get(name: string, id: pulumi.Input<pulumi.ID>, state?: AclState, opts?: pulumi.CustomResourceOptions): Acl;
    /**
     * Returns true if the given object is an instance of Acl.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is Acl;
    /**
     * When set to true, allows the resource to be removed from state even if the cluster is unreachable
     */
    readonly allowDeletion: pulumi.Output<boolean>;
    /**
     * The cluster API URL. Changing this will prevent deletion of the resource on the existing cluster. It is generally a better idea to delete an existing resource and create a new one than to change this value unless you are planning to do state imports
     */
    readonly clusterApiUrl: pulumi.Output<string>;
    /**
     * The host address to use for this ACL
     */
    readonly host: pulumi.Output<string>;
    /**
     * The operation type that shall be allowed or denied (e.g READ)
     */
    readonly operation: pulumi.Output<string>;
    /**
     * The permission type. It determines whether the operation should be ALLOWED or DENIED
     */
    readonly permissionType: pulumi.Output<string>;
    /**
     * The principal to apply this ACL for
     */
    readonly principal: pulumi.Output<string>;
    /**
     * The name of the resource this ACL entry will be on
     */
    readonly resourceName: pulumi.Output<string>;
    /**
     * The pattern type of the resource. It determines the strategy how the provided resource name is matched (LITERAL, MATCH, PREFIXED, etc ...) against the actual resource names
     */
    readonly resourcePatternType: pulumi.Output<string>;
    /**
     * The type of the resource (TOPIC, GROUP, etc...) this ACL shall target
     */
    readonly resourceType: pulumi.Output<string>;
    /**
     * Create a Acl resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: AclArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering Acl resources.
 */
export interface AclState {
    /**
     * When set to true, allows the resource to be removed from state even if the cluster is unreachable
     */
    allowDeletion?: pulumi.Input<boolean>;
    /**
     * The cluster API URL. Changing this will prevent deletion of the resource on the existing cluster. It is generally a better idea to delete an existing resource and create a new one than to change this value unless you are planning to do state imports
     */
    clusterApiUrl?: pulumi.Input<string>;
    /**
     * The host address to use for this ACL
     */
    host?: pulumi.Input<string>;
    /**
     * The operation type that shall be allowed or denied (e.g READ)
     */
    operation?: pulumi.Input<string>;
    /**
     * The permission type. It determines whether the operation should be ALLOWED or DENIED
     */
    permissionType?: pulumi.Input<string>;
    /**
     * The principal to apply this ACL for
     */
    principal?: pulumi.Input<string>;
    /**
     * The name of the resource this ACL entry will be on
     */
    resourceName?: pulumi.Input<string>;
    /**
     * The pattern type of the resource. It determines the strategy how the provided resource name is matched (LITERAL, MATCH, PREFIXED, etc ...) against the actual resource names
     */
    resourcePatternType?: pulumi.Input<string>;
    /**
     * The type of the resource (TOPIC, GROUP, etc...) this ACL shall target
     */
    resourceType?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a Acl resource.
 */
export interface AclArgs {
    /**
     * When set to true, allows the resource to be removed from state even if the cluster is unreachable
     */
    allowDeletion?: pulumi.Input<boolean>;
    /**
     * The cluster API URL. Changing this will prevent deletion of the resource on the existing cluster. It is generally a better idea to delete an existing resource and create a new one than to change this value unless you are planning to do state imports
     */
    clusterApiUrl: pulumi.Input<string>;
    /**
     * The host address to use for this ACL
     */
    host: pulumi.Input<string>;
    /**
     * The operation type that shall be allowed or denied (e.g READ)
     */
    operation: pulumi.Input<string>;
    /**
     * The permission type. It determines whether the operation should be ALLOWED or DENIED
     */
    permissionType: pulumi.Input<string>;
    /**
     * The principal to apply this ACL for
     */
    principal: pulumi.Input<string>;
    /**
     * The name of the resource this ACL entry will be on
     */
    resourceName: pulumi.Input<string>;
    /**
     * The pattern type of the resource. It determines the strategy how the provided resource name is matched (LITERAL, MATCH, PREFIXED, etc ...) against the actual resource names
     */
    resourcePatternType: pulumi.Input<string>;
    /**
     * The type of the resource (TOPIC, GROUP, etc...) this ACL shall target
     */
    resourceType: pulumi.Input<string>;
}
