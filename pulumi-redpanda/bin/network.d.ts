import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class Network extends pulumi.CustomResource {
    /**
     * Get an existing Network resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param state Any extra arguments used during the lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    static get(name: string, id: pulumi.Input<pulumi.ID>, state?: NetworkState, opts?: pulumi.CustomResourceOptions): Network;
    /**
     * Returns true if the given object is an instance of Network.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is Network;
    /**
     * The<span pulumi-lang-nodejs=" cidrBlock " pulumi-lang-dotnet=" CidrBlock " pulumi-lang-go=" cidrBlock " pulumi-lang-python=" cidr_block " pulumi-lang-yaml=" cidrBlock " pulumi-lang-java=" cidrBlock "> cidr_block </span>to create the network in
     */
    readonly cidrBlock: pulumi.Output<string | undefined>;
    /**
     * The cloud provider to create the network in.
     */
    readonly cloudProvider: pulumi.Output<string>;
    /**
     * The type of cluster this network is associated with, can be one of dedicated or byoc
     */
    readonly clusterType: pulumi.Output<string>;
    readonly customerManagedResources: pulumi.Output<outputs.NetworkCustomerManagedResources | undefined>;
    /**
     * Name of the network
     */
    readonly name: pulumi.Output<string>;
    /**
     * The region to create the network in.
     */
    readonly region: pulumi.Output<string>;
    /**
     * The ID of the resource group in which to create the network
     */
    readonly resourceGroupId: pulumi.Output<string>;
    /**
     * Current state of the network.
     */
    readonly state: pulumi.Output<string>;
    readonly timeouts: pulumi.Output<outputs.NetworkTimeouts | undefined>;
    /**
     * Network availability zones.
     */
    readonly zones: pulumi.Output<string[]>;
    /**
     * Create a Network resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: NetworkArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering Network resources.
 */
export interface NetworkState {
    /**
     * The<span pulumi-lang-nodejs=" cidrBlock " pulumi-lang-dotnet=" CidrBlock " pulumi-lang-go=" cidrBlock " pulumi-lang-python=" cidr_block " pulumi-lang-yaml=" cidrBlock " pulumi-lang-java=" cidrBlock "> cidr_block </span>to create the network in
     */
    cidrBlock?: pulumi.Input<string>;
    /**
     * The cloud provider to create the network in.
     */
    cloudProvider?: pulumi.Input<string>;
    /**
     * The type of cluster this network is associated with, can be one of dedicated or byoc
     */
    clusterType?: pulumi.Input<string>;
    customerManagedResources?: pulumi.Input<inputs.NetworkCustomerManagedResources>;
    /**
     * Name of the network
     */
    name?: pulumi.Input<string>;
    /**
     * The region to create the network in.
     */
    region?: pulumi.Input<string>;
    /**
     * The ID of the resource group in which to create the network
     */
    resourceGroupId?: pulumi.Input<string>;
    /**
     * Current state of the network.
     */
    state?: pulumi.Input<string>;
    timeouts?: pulumi.Input<inputs.NetworkTimeouts>;
    /**
     * Network availability zones.
     */
    zones?: pulumi.Input<pulumi.Input<string>[]>;
}
/**
 * The set of arguments for constructing a Network resource.
 */
export interface NetworkArgs {
    /**
     * The<span pulumi-lang-nodejs=" cidrBlock " pulumi-lang-dotnet=" CidrBlock " pulumi-lang-go=" cidrBlock " pulumi-lang-python=" cidr_block " pulumi-lang-yaml=" cidrBlock " pulumi-lang-java=" cidrBlock "> cidr_block </span>to create the network in
     */
    cidrBlock?: pulumi.Input<string>;
    /**
     * The cloud provider to create the network in.
     */
    cloudProvider: pulumi.Input<string>;
    /**
     * The type of cluster this network is associated with, can be one of dedicated or byoc
     */
    clusterType: pulumi.Input<string>;
    customerManagedResources?: pulumi.Input<inputs.NetworkCustomerManagedResources>;
    /**
     * Name of the network
     */
    name?: pulumi.Input<string>;
    /**
     * The region to create the network in.
     */
    region: pulumi.Input<string>;
    /**
     * The ID of the resource group in which to create the network
     */
    resourceGroupId: pulumi.Input<string>;
    timeouts?: pulumi.Input<inputs.NetworkTimeouts>;
}
