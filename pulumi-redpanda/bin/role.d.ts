import * as pulumi from "@pulumi/pulumi";
export declare class Role extends pulumi.CustomResource {
    /**
     * Get an existing Role resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param state Any extra arguments used during the lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    static get(name: string, id: pulumi.Input<pulumi.ID>, state?: RoleState, opts?: pulumi.CustomResourceOptions): Role;
    /**
     * Returns true if the given object is an instance of Role.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is Role;
    /**
     * Allows deletion of the role. If false, the role cannot be deleted and the resource will be removed from the state on destruction. Defaults to false.
     */
    readonly allowDeletion: pulumi.Output<boolean>;
    /**
     * The cluster API URL. Changing this will prevent deletion of the resource on the existing cluster. It is generally a better idea to delete an existing resource and create a new one than to change this value unless you are planning to do state imports
     */
    readonly clusterApiUrl: pulumi.Output<string>;
    /**
     * Whether to delete the ACLs bound to the role when the role is deleted. Defaults to false.
     */
    readonly deleteAcls: pulumi.Output<boolean>;
    /**
     * Name of the role, must be unique
     */
    readonly name: pulumi.Output<string>;
    /**
     * Create a Role resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: RoleArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering Role resources.
 */
export interface RoleState {
    /**
     * Allows deletion of the role. If false, the role cannot be deleted and the resource will be removed from the state on destruction. Defaults to false.
     */
    allowDeletion?: pulumi.Input<boolean>;
    /**
     * The cluster API URL. Changing this will prevent deletion of the resource on the existing cluster. It is generally a better idea to delete an existing resource and create a new one than to change this value unless you are planning to do state imports
     */
    clusterApiUrl?: pulumi.Input<string>;
    /**
     * Whether to delete the ACLs bound to the role when the role is deleted. Defaults to false.
     */
    deleteAcls?: pulumi.Input<boolean>;
    /**
     * Name of the role, must be unique
     */
    name?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a Role resource.
 */
export interface RoleArgs {
    /**
     * Allows deletion of the role. If false, the role cannot be deleted and the resource will be removed from the state on destruction. Defaults to false.
     */
    allowDeletion?: pulumi.Input<boolean>;
    /**
     * The cluster API URL. Changing this will prevent deletion of the resource on the existing cluster. It is generally a better idea to delete an existing resource and create a new one than to change this value unless you are planning to do state imports
     */
    clusterApiUrl: pulumi.Input<string>;
    /**
     * Whether to delete the ACLs bound to the role when the role is deleted. Defaults to false.
     */
    deleteAcls?: pulumi.Input<boolean>;
    /**
     * Name of the role, must be unique
     */
    name?: pulumi.Input<string>;
}
