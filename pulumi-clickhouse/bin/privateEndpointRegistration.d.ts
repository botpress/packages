import * as pulumi from "@pulumi/pulumi";
export declare class PrivateEndpointRegistration extends pulumi.CustomResource {
    /**
     * Get an existing PrivateEndpointRegistration resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param state Any extra arguments used during the lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    static get(name: string, id: pulumi.Input<pulumi.ID>, state?: PrivateEndpointRegistrationState, opts?: pulumi.CustomResourceOptions): PrivateEndpointRegistration;
    /**
     * Returns true if the given object is an instance of PrivateEndpointRegistration.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is PrivateEndpointRegistration;
    /**
     * Cloud provider of the private endpoint ID
     */
    readonly cloudProvider: pulumi.Output<string>;
    /**
     * Description of the private endpoint
     */
    readonly description: pulumi.Output<string | undefined>;
    /**
     * ID of the private endpoint (replaces deprecated attribute <span pulumi-lang-nodejs="`id`" pulumi-lang-dotnet="`Id`" pulumi-lang-go="`id`" pulumi-lang-python="`id`" pulumi-lang-yaml="`id`" pulumi-lang-java="`id`">`id`</span>)
     */
    readonly privateEndpointId: pulumi.Output<string>;
    /**
     * Region of the private endpoint
     */
    readonly region: pulumi.Output<string>;
    /**
     * Create a PrivateEndpointRegistration resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: PrivateEndpointRegistrationArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering PrivateEndpointRegistration resources.
 */
export interface PrivateEndpointRegistrationState {
    /**
     * Cloud provider of the private endpoint ID
     */
    cloudProvider?: pulumi.Input<string>;
    /**
     * Description of the private endpoint
     */
    description?: pulumi.Input<string>;
    /**
     * ID of the private endpoint (replaces deprecated attribute <span pulumi-lang-nodejs="`id`" pulumi-lang-dotnet="`Id`" pulumi-lang-go="`id`" pulumi-lang-python="`id`" pulumi-lang-yaml="`id`" pulumi-lang-java="`id`">`id`</span>)
     */
    privateEndpointId?: pulumi.Input<string>;
    /**
     * Region of the private endpoint
     */
    region?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a PrivateEndpointRegistration resource.
 */
export interface PrivateEndpointRegistrationArgs {
    /**
     * Cloud provider of the private endpoint ID
     */
    cloudProvider: pulumi.Input<string>;
    /**
     * Description of the private endpoint
     */
    description?: pulumi.Input<string>;
    /**
     * ID of the private endpoint (replaces deprecated attribute <span pulumi-lang-nodejs="`id`" pulumi-lang-dotnet="`Id`" pulumi-lang-go="`id`" pulumi-lang-python="`id`" pulumi-lang-yaml="`id`" pulumi-lang-java="`id`">`id`</span>)
     */
    privateEndpointId: pulumi.Input<string>;
    /**
     * Region of the private endpoint
     */
    region: pulumi.Input<string>;
}
