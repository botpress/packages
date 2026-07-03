import * as pulumi from "@pulumi/pulumi";
export declare class User extends pulumi.CustomResource {
    /**
     * Get an existing User resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param state Any extra arguments used during the lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    static get(name: string, id: pulumi.Input<pulumi.ID>, state?: UserState, opts?: pulumi.CustomResourceOptions): User;
    /**
     * Returns true if the given object is an instance of User.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is User;
    /**
     * Allows deletion of the user. If false, the user cannot be deleted and the resource will be removed from the state on destruction. Defaults to false.
     */
    readonly allowDeletion: pulumi.Output<boolean>;
    /**
     * The cluster API URL. Changing this will prevent deletion of the resource on the existing cluster. It is generally a better idea to delete an existing resource and create a new one than to change this value unless you are planning to do state imports
     */
    readonly clusterApiUrl: pulumi.Output<string>;
    /**
     * Which authentication method to use, see https://docs.redpanda.com/current/manage/security/authentication/ for more information
     */
    readonly mechanism: pulumi.Output<string | undefined>;
    /**
     * Name of the user, must be unique
     */
    readonly name: pulumi.Output<string>;
    /**
     * Password of the user. Deprecated: use<span pulumi-lang-nodejs=" passwordWo " pulumi-lang-dotnet=" PasswordWo " pulumi-lang-go=" passwordWo " pulumi-lang-python=" password_wo " pulumi-lang-yaml=" passwordWo " pulumi-lang-java=" passwordWo "> password_wo </span>instead to avoid storing password in state.
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
     * Create a User resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: UserArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering User resources.
 */
export interface UserState {
    /**
     * Allows deletion of the user. If false, the user cannot be deleted and the resource will be removed from the state on destruction. Defaults to false.
     */
    allowDeletion?: pulumi.Input<boolean>;
    /**
     * The cluster API URL. Changing this will prevent deletion of the resource on the existing cluster. It is generally a better idea to delete an existing resource and create a new one than to change this value unless you are planning to do state imports
     */
    clusterApiUrl?: pulumi.Input<string>;
    /**
     * Which authentication method to use, see https://docs.redpanda.com/current/manage/security/authentication/ for more information
     */
    mechanism?: pulumi.Input<string>;
    /**
     * Name of the user, must be unique
     */
    name?: pulumi.Input<string>;
    /**
     * Password of the user. Deprecated: use<span pulumi-lang-nodejs=" passwordWo " pulumi-lang-dotnet=" PasswordWo " pulumi-lang-go=" passwordWo " pulumi-lang-python=" password_wo " pulumi-lang-yaml=" passwordWo " pulumi-lang-java=" passwordWo "> password_wo </span>instead to avoid storing password in state.
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
}
/**
 * The set of arguments for constructing a User resource.
 */
export interface UserArgs {
    /**
     * Allows deletion of the user. If false, the user cannot be deleted and the resource will be removed from the state on destruction. Defaults to false.
     */
    allowDeletion?: pulumi.Input<boolean>;
    /**
     * The cluster API URL. Changing this will prevent deletion of the resource on the existing cluster. It is generally a better idea to delete an existing resource and create a new one than to change this value unless you are planning to do state imports
     */
    clusterApiUrl: pulumi.Input<string>;
    /**
     * Which authentication method to use, see https://docs.redpanda.com/current/manage/security/authentication/ for more information
     */
    mechanism?: pulumi.Input<string>;
    /**
     * Name of the user, must be unique
     */
    name?: pulumi.Input<string>;
    /**
     * Password of the user. Deprecated: use<span pulumi-lang-nodejs=" passwordWo " pulumi-lang-dotnet=" PasswordWo " pulumi-lang-go=" passwordWo " pulumi-lang-python=" password_wo " pulumi-lang-yaml=" passwordWo " pulumi-lang-java=" passwordWo "> password_wo </span>instead to avoid storing password in state.
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
}
