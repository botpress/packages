import * as pulumi from "@pulumi/pulumi";
export declare class ServicePrivateEndpointsAttachment extends pulumi.CustomResource {
    /**
     * Get an existing ServicePrivateEndpointsAttachment resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param state Any extra arguments used during the lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    static get(name: string, id: pulumi.Input<pulumi.ID>, state?: ServicePrivateEndpointsAttachmentState, opts?: pulumi.CustomResourceOptions): ServicePrivateEndpointsAttachment;
    /**
     * Returns true if the given object is an instance of ServicePrivateEndpointsAttachment.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is ServicePrivateEndpointsAttachment;
    /**
     * List of private endpoint IDs
     */
    readonly privateEndpointIds: pulumi.Output<string[]>;
    /**
     * ClickHouse Service ID
     */
    readonly serviceId: pulumi.Output<string | undefined>;
    /**
     * Create a ServicePrivateEndpointsAttachment resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args?: ServicePrivateEndpointsAttachmentArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering ServicePrivateEndpointsAttachment resources.
 */
export interface ServicePrivateEndpointsAttachmentState {
    /**
     * List of private endpoint IDs
     */
    privateEndpointIds?: pulumi.Input<pulumi.Input<string>[]>;
    /**
     * ClickHouse Service ID
     */
    serviceId?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a ServicePrivateEndpointsAttachment resource.
 */
export interface ServicePrivateEndpointsAttachmentArgs {
    /**
     * List of private endpoint IDs
     */
    privateEndpointIds?: pulumi.Input<pulumi.Input<string>[]>;
    /**
     * ClickHouse Service ID
     */
    serviceId?: pulumi.Input<string>;
}
