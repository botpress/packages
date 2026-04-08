import * as pulumi from "@pulumi/pulumi";
export declare class RoleAssignment extends pulumi.CustomResource {
    /**
     * Get an existing RoleAssignment resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param state Any extra arguments used during the lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    static get(name: string, id: pulumi.Input<pulumi.ID>, state?: RoleAssignmentState, opts?: pulumi.CustomResourceOptions): RoleAssignment;
    /**
     * Returns true if the given object is an instance of RoleAssignment.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is RoleAssignment;
    /**
     * The cluster API URL. Changing this will prevent deletion of the resource on the existing cluster
     */
    readonly clusterApiUrl: pulumi.Output<string>;
    /**
     * The principal to assign the role to. Specify just the username (e.g., `"john.doe"`)
     */
    readonly principal: pulumi.Output<string>;
    /**
     * The name of the role to assign
     */
    readonly roleName: pulumi.Output<string>;
    /**
     * Create a RoleAssignment resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: RoleAssignmentArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering RoleAssignment resources.
 */
export interface RoleAssignmentState {
    /**
     * The cluster API URL. Changing this will prevent deletion of the resource on the existing cluster
     */
    clusterApiUrl?: pulumi.Input<string>;
    /**
     * The principal to assign the role to. Specify just the username (e.g., `"john.doe"`)
     */
    principal?: pulumi.Input<string>;
    /**
     * The name of the role to assign
     */
    roleName?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a RoleAssignment resource.
 */
export interface RoleAssignmentArgs {
    /**
     * The cluster API URL. Changing this will prevent deletion of the resource on the existing cluster
     */
    clusterApiUrl: pulumi.Input<string>;
    /**
     * The principal to assign the role to. Specify just the username (e.g., `"john.doe"`)
     */
    principal: pulumi.Input<string>;
    /**
     * The name of the role to assign
     */
    roleName: pulumi.Input<string>;
}
