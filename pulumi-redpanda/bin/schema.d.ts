import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare class Schema extends pulumi.CustomResource {
    /**
     * Get an existing Schema resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param state Any extra arguments used during the lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    static get(name: string, id: pulumi.Input<pulumi.ID>, state?: SchemaState, opts?: pulumi.CustomResourceOptions): Schema;
    /**
     * Returns true if the given object is an instance of Schema.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is Schema;
    /**
     * When enabled, prevents the resource from being deleted if the cluster is unreachable. When disabled (default), the resource will be removed from state without attempting deletion when the cluster is unreachable.
     */
    readonly allowDeletion: pulumi.Output<boolean>;
    /**
     * The ID of the cluster where the schema is stored.
     */
    readonly clusterId: pulumi.Output<string>;
    /**
     * The compatibility level for schema evolution (BACKWARD, BACKWARD_TRANSITIVE, FORWARD, FORWARD_TRANSITIVE, FULL, FULL_TRANSITIVE, NONE). Defaults to BACKWARD.
     */
    readonly compatibility: pulumi.Output<string>;
    /**
     * The SASL password for Schema Registry authentication. Deprecated: use<span pulumi-lang-nodejs=" passwordWo " pulumi-lang-dotnet=" PasswordWo " pulumi-lang-go=" passwordWo " pulumi-lang-python=" password_wo " pulumi-lang-yaml=" passwordWo " pulumi-lang-java=" passwordWo "> password_wo </span>instead.
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
     * List of schema references.
     */
    readonly references: pulumi.Output<outputs.SchemaReference[] | undefined>;
    /**
     * The schema definition in JSON format.
     */
    readonly schema: pulumi.Output<string>;
    /**
     * The unique identifier for the schema.
     */
    readonly schemaId: pulumi.Output<number>;
    /**
     * The type of schema (AVRO, JSON, PROTOBUF).
     */
    readonly schemaType: pulumi.Output<string>;
    /**
     * The subject name for the schema.
     */
    readonly subject: pulumi.Output<string>;
    /**
     * The SASL username for Schema Registry authentication.
     */
    readonly username: pulumi.Output<string>;
    /**
     * The version of the schema.
     */
    readonly version: pulumi.Output<number>;
    /**
     * Create a Schema resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: SchemaArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering Schema resources.
 */
export interface SchemaState {
    /**
     * When enabled, prevents the resource from being deleted if the cluster is unreachable. When disabled (default), the resource will be removed from state without attempting deletion when the cluster is unreachable.
     */
    allowDeletion?: pulumi.Input<boolean>;
    /**
     * The ID of the cluster where the schema is stored.
     */
    clusterId?: pulumi.Input<string>;
    /**
     * The compatibility level for schema evolution (BACKWARD, BACKWARD_TRANSITIVE, FORWARD, FORWARD_TRANSITIVE, FULL, FULL_TRANSITIVE, NONE). Defaults to BACKWARD.
     */
    compatibility?: pulumi.Input<string>;
    /**
     * The SASL password for Schema Registry authentication. Deprecated: use<span pulumi-lang-nodejs=" passwordWo " pulumi-lang-dotnet=" PasswordWo " pulumi-lang-go=" passwordWo " pulumi-lang-python=" password_wo " pulumi-lang-yaml=" passwordWo " pulumi-lang-java=" passwordWo "> password_wo </span>instead.
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
     * List of schema references.
     */
    references?: pulumi.Input<pulumi.Input<inputs.SchemaReference>[]>;
    /**
     * The schema definition in JSON format.
     */
    schema?: pulumi.Input<string>;
    /**
     * The unique identifier for the schema.
     */
    schemaId?: pulumi.Input<number>;
    /**
     * The type of schema (AVRO, JSON, PROTOBUF).
     */
    schemaType?: pulumi.Input<string>;
    /**
     * The subject name for the schema.
     */
    subject?: pulumi.Input<string>;
    /**
     * The SASL username for Schema Registry authentication.
     */
    username?: pulumi.Input<string>;
    /**
     * The version of the schema.
     */
    version?: pulumi.Input<number>;
}
/**
 * The set of arguments for constructing a Schema resource.
 */
export interface SchemaArgs {
    /**
     * When enabled, prevents the resource from being deleted if the cluster is unreachable. When disabled (default), the resource will be removed from state without attempting deletion when the cluster is unreachable.
     */
    allowDeletion?: pulumi.Input<boolean>;
    /**
     * The ID of the cluster where the schema is stored.
     */
    clusterId: pulumi.Input<string>;
    /**
     * The compatibility level for schema evolution (BACKWARD, BACKWARD_TRANSITIVE, FORWARD, FORWARD_TRANSITIVE, FULL, FULL_TRANSITIVE, NONE). Defaults to BACKWARD.
     */
    compatibility?: pulumi.Input<string>;
    /**
     * The SASL password for Schema Registry authentication. Deprecated: use<span pulumi-lang-nodejs=" passwordWo " pulumi-lang-dotnet=" PasswordWo " pulumi-lang-go=" passwordWo " pulumi-lang-python=" password_wo " pulumi-lang-yaml=" passwordWo " pulumi-lang-java=" passwordWo "> password_wo </span>instead.
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
     * List of schema references.
     */
    references?: pulumi.Input<pulumi.Input<inputs.SchemaReference>[]>;
    /**
     * The schema definition in JSON format.
     */
    schema: pulumi.Input<string>;
    /**
     * The type of schema (AVRO, JSON, PROTOBUF).
     */
    schemaType?: pulumi.Input<string>;
    /**
     * The subject name for the schema.
     */
    subject: pulumi.Input<string>;
    /**
     * The SASL username for Schema Registry authentication.
     */
    username: pulumi.Input<string>;
}
