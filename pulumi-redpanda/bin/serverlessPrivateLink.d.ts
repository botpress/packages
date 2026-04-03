import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class ServerlessPrivateLink extends pulumi.CustomResource {
    /**
     * Get an existing ServerlessPrivateLink resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param state Any extra arguments used during the lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    static get(name: string, id: pulumi.Input<pulumi.ID>, state?: ServerlessPrivateLinkState, opts?: pulumi.CustomResourceOptions): ServerlessPrivateLink;
    /**
     * Returns true if the given object is an instance of ServerlessPrivateLink.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is ServerlessPrivateLink;
    /**
     * Allows deletion of the serverless private link. Defaults to false.
     */
    readonly allowDeletion: pulumi.Output<boolean>;
    /**
     * Cloud provider (aws)
     */
    readonly cloudProvider: pulumi.Output<string>;
    /**
     * Cloud provider specific configuration
     */
    readonly cloudProviderConfig: pulumi.Output<outputs.ServerlessPrivateLinkCloudProviderConfig>;
    /**
     * Timestamp when the serverless private link was created
     */
    readonly createdAt: pulumi.Output<string>;
    /**
     * Name of the serverless private link
     */
    readonly name: pulumi.Output<string>;
    /**
     * The ID of the Resource Group in which to create the serverless private link
     */
    readonly resourceGroupId: pulumi.Output<string>;
    /**
     * Redpanda serverless region
     */
    readonly serverlessRegion: pulumi.Output<string>;
    /**
     * Current state of the serverless private link (STATE_CREATING, STATE_READY, STATE_DELETING, STATE_FAILED, STATE_UPDATING)
     */
    readonly state: pulumi.Output<string>;
    /**
     * Cloud provider specific status information
     */
    readonly status: pulumi.Output<outputs.ServerlessPrivateLinkStatus>;
    /**
     * Timestamp when the serverless private link was last updated. This value changes on every update operation.
     */
    readonly updatedAt: pulumi.Output<string>;
    /**
     * Create a ServerlessPrivateLink resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: ServerlessPrivateLinkArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering ServerlessPrivateLink resources.
 */
export interface ServerlessPrivateLinkState {
    /**
     * Allows deletion of the serverless private link. Defaults to false.
     */
    allowDeletion?: pulumi.Input<boolean>;
    /**
     * Cloud provider (aws)
     */
    cloudProvider?: pulumi.Input<string>;
    /**
     * Cloud provider specific configuration
     */
    cloudProviderConfig?: pulumi.Input<inputs.ServerlessPrivateLinkCloudProviderConfig>;
    /**
     * Timestamp when the serverless private link was created
     */
    createdAt?: pulumi.Input<string>;
    /**
     * Name of the serverless private link
     */
    name?: pulumi.Input<string>;
    /**
     * The ID of the Resource Group in which to create the serverless private link
     */
    resourceGroupId?: pulumi.Input<string>;
    /**
     * Redpanda serverless region
     */
    serverlessRegion?: pulumi.Input<string>;
    /**
     * Current state of the serverless private link (STATE_CREATING, STATE_READY, STATE_DELETING, STATE_FAILED, STATE_UPDATING)
     */
    state?: pulumi.Input<string>;
    /**
     * Cloud provider specific status information
     */
    status?: pulumi.Input<inputs.ServerlessPrivateLinkStatus>;
    /**
     * Timestamp when the serverless private link was last updated. This value changes on every update operation.
     */
    updatedAt?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a ServerlessPrivateLink resource.
 */
export interface ServerlessPrivateLinkArgs {
    /**
     * Allows deletion of the serverless private link. Defaults to false.
     */
    allowDeletion?: pulumi.Input<boolean>;
    /**
     * Cloud provider (aws)
     */
    cloudProvider: pulumi.Input<string>;
    /**
     * Cloud provider specific configuration
     */
    cloudProviderConfig: pulumi.Input<inputs.ServerlessPrivateLinkCloudProviderConfig>;
    /**
     * Name of the serverless private link
     */
    name?: pulumi.Input<string>;
    /**
     * The ID of the Resource Group in which to create the serverless private link
     */
    resourceGroupId: pulumi.Input<string>;
    /**
     * Redpanda serverless region
     */
    serverlessRegion: pulumi.Input<string>;
}
