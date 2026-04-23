import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class Pipeline extends pulumi.CustomResource {
    /**
     * Get an existing Pipeline resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param state Any extra arguments used during the lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    static get(name: string, id: pulumi.Input<pulumi.ID>, state?: PipelineState, opts?: pulumi.CustomResourceOptions): Pipeline;
    /**
     * Returns true if the given object is an instance of Pipeline.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is Pipeline;
    /**
     * Allows deletion of the pipeline. Default is false. Must be set to true to delete the resource.
     */
    readonly allowDeletion: pulumi.Output<boolean>;
    /**
     * The cluster API URL. Changing this will prevent deletion of the resource on the existing cluster. It is generally a better idea to delete an existing resource and create a new one than to change this value unless you are planning to do state imports.
     */
    readonly clusterApiUrl: pulumi.Output<string>;
    /**
     * The Redpanda Connect pipeline configuration in YAML format. See https://docs.redpanda.com/redpanda-cloud/develop/connect/configuration/about for configuration details.
     */
    readonly configYaml: pulumi.Output<string>;
    /**
     * Optional description of the pipeline.
     */
    readonly description: pulumi.Output<string | undefined>;
    /**
     * User-friendly display name for the pipeline.
     */
    readonly displayName: pulumi.Output<string>;
    /**
     * Resource allocation for the pipeline.
     */
    readonly resources: pulumi.Output<outputs.PipelineResources>;
    /**
     * Service account credentials for the pipeline. Used to authenticate the pipeline with external services.
     */
    readonly serviceAccount: pulumi.Output<outputs.PipelineServiceAccount | undefined>;
    /**
     * Desired state of the pipeline: 'running' or 'stopped'. The provider will ensure the pipeline reaches this state after create/update operations.
     */
    readonly state: pulumi.Output<string>;
    /**
     * Pipeline status information.
     */
    readonly status: pulumi.Output<outputs.PipelineStatus>;
    /**
     * Key-value pairs to tag the pipeline for organization and filtering.
     */
    readonly tags: pulumi.Output<{
        [key: string]: string;
    } | undefined>;
    readonly timeouts: pulumi.Output<outputs.PipelineTimeouts | undefined>;
    /**
     * URL to connect to the pipeline's HTTP server, if applicable.
     */
    readonly url: pulumi.Output<string>;
    /**
     * Create a Pipeline resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: PipelineArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering Pipeline resources.
 */
export interface PipelineState {
    /**
     * Allows deletion of the pipeline. Default is false. Must be set to true to delete the resource.
     */
    allowDeletion?: pulumi.Input<boolean>;
    /**
     * The cluster API URL. Changing this will prevent deletion of the resource on the existing cluster. It is generally a better idea to delete an existing resource and create a new one than to change this value unless you are planning to do state imports.
     */
    clusterApiUrl?: pulumi.Input<string>;
    /**
     * The Redpanda Connect pipeline configuration in YAML format. See https://docs.redpanda.com/redpanda-cloud/develop/connect/configuration/about for configuration details.
     */
    configYaml?: pulumi.Input<string>;
    /**
     * Optional description of the pipeline.
     */
    description?: pulumi.Input<string>;
    /**
     * User-friendly display name for the pipeline.
     */
    displayName?: pulumi.Input<string>;
    /**
     * Resource allocation for the pipeline.
     */
    resources?: pulumi.Input<inputs.PipelineResources>;
    /**
     * Service account credentials for the pipeline. Used to authenticate the pipeline with external services.
     */
    serviceAccount?: pulumi.Input<inputs.PipelineServiceAccount>;
    /**
     * Desired state of the pipeline: 'running' or 'stopped'. The provider will ensure the pipeline reaches this state after create/update operations.
     */
    state?: pulumi.Input<string>;
    /**
     * Pipeline status information.
     */
    status?: pulumi.Input<inputs.PipelineStatus>;
    /**
     * Key-value pairs to tag the pipeline for organization and filtering.
     */
    tags?: pulumi.Input<{
        [key: string]: pulumi.Input<string>;
    }>;
    timeouts?: pulumi.Input<inputs.PipelineTimeouts>;
    /**
     * URL to connect to the pipeline's HTTP server, if applicable.
     */
    url?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a Pipeline resource.
 */
export interface PipelineArgs {
    /**
     * Allows deletion of the pipeline. Default is false. Must be set to true to delete the resource.
     */
    allowDeletion?: pulumi.Input<boolean>;
    /**
     * The cluster API URL. Changing this will prevent deletion of the resource on the existing cluster. It is generally a better idea to delete an existing resource and create a new one than to change this value unless you are planning to do state imports.
     */
    clusterApiUrl: pulumi.Input<string>;
    /**
     * The Redpanda Connect pipeline configuration in YAML format. See https://docs.redpanda.com/redpanda-cloud/develop/connect/configuration/about for configuration details.
     */
    configYaml: pulumi.Input<string>;
    /**
     * Optional description of the pipeline.
     */
    description?: pulumi.Input<string>;
    /**
     * User-friendly display name for the pipeline.
     */
    displayName: pulumi.Input<string>;
    /**
     * Resource allocation for the pipeline.
     */
    resources?: pulumi.Input<inputs.PipelineResources>;
    /**
     * Service account credentials for the pipeline. Used to authenticate the pipeline with external services.
     */
    serviceAccount?: pulumi.Input<inputs.PipelineServiceAccount>;
    /**
     * Desired state of the pipeline: 'running' or 'stopped'. The provider will ensure the pipeline reaches this state after create/update operations.
     */
    state?: pulumi.Input<string>;
    /**
     * Key-value pairs to tag the pipeline for organization and filtering.
     */
    tags?: pulumi.Input<{
        [key: string]: pulumi.Input<string>;
    }>;
    timeouts?: pulumi.Input<inputs.PipelineTimeouts>;
}
