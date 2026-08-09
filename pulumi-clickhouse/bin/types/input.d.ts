import * as pulumi from "@pulumi/pulumi";
import * as inputs from "../types/input";
export interface ServiceBackupConfiguration {
    /**
     * Interval in hours between each backup.
     */
    backupPeriodInHours?: pulumi.Input<number>;
    /**
     * How long in hours to keep a backup before deleting it.
     */
    backupRetentionPeriodInHours?: pulumi.Input<number>;
    /**
     * Time of the day in UTC that indicates the start time of a 2 hours window to be used for backup. If set,<span pulumi-lang-nodejs=" backupPeriodInHours " pulumi-lang-dotnet=" BackupPeriodInHours " pulumi-lang-go=" backupPeriodInHours " pulumi-lang-python=" backup_period_in_hours " pulumi-lang-yaml=" backupPeriodInHours " pulumi-lang-java=" backupPeriodInHours "> backup_period_in_hours </span>must be null and backups are created once a day.
     */
    backupStartTime?: pulumi.Input<string>;
}
export interface ServiceEndpoints {
    https?: pulumi.Input<inputs.ServiceEndpointsHttps>;
    mysql?: pulumi.Input<inputs.ServiceEndpointsMysql>;
    nativesecure?: pulumi.Input<inputs.ServiceEndpointsNativesecure>;
}
export interface ServiceEndpointsHttps {
    /**
     * Endpoint host.
     */
    host?: pulumi.Input<string>;
    /**
     * Endpoint port.
     */
    port?: pulumi.Input<number>;
}
export interface ServiceEndpointsMysql {
    /**
     * Wether to enable the mysql endpoint or not.
     */
    enabled: pulumi.Input<boolean>;
    /**
     * Endpoint host.
     */
    host?: pulumi.Input<string>;
    /**
     * Endpoint port.
     */
    port?: pulumi.Input<number>;
}
export interface ServiceEndpointsNativesecure {
    /**
     * Endpoint host.
     */
    host?: pulumi.Input<string>;
    /**
     * Endpoint port.
     */
    port?: pulumi.Input<number>;
}
export interface ServiceIpAccess {
    /**
     * Description of the IP address.
     */
    description: pulumi.Input<string>;
    /**
     * IP address allowed to access the service. In case you want to set the<span pulumi-lang-nodejs=" ipAccess " pulumi-lang-dotnet=" IpAccess " pulumi-lang-go=" ipAccess " pulumi-lang-python=" ip_access " pulumi-lang-yaml=" ipAccess " pulumi-lang-java=" ipAccess "> ip_access </span>to anywhere you should set source to 0.0.0.0/0
     */
    source: pulumi.Input<string>;
}
export interface ServicePrivateEndpointConfig {
    /**
     * Unique identifier of the interface endpoint you created in your VPC with the AWS(Service Name) or GCP(Target Service) resource.
     */
    endpointServiceId?: pulumi.Input<string>;
    /**
     * Private DNS Hostname of the VPC you created.
     */
    privateDnsHostname?: pulumi.Input<string>;
}
export interface ServiceQueryApiEndpoints {
    /**
     * Comma separated list of domain names to be allowed cross-origin resource sharing (CORS) access to the query API. Leave this field empty to restrict access to backend servers only
     */
    allowedOrigins?: pulumi.Input<string>;
    /**
     * The UUIDs of the API Keys to grant access to the query API.
     */
    apiKeyIds: pulumi.Input<pulumi.Input<string>[]>;
    /**
     * The Database role that will be used to run the query.
     */
    roles: pulumi.Input<pulumi.Input<string>[]>;
}
export interface ServiceTransparentDataEncryption {
    /**
     * If true, TDE is enabled for the service.
     */
    enabled?: pulumi.Input<boolean>;
    /**
     * ID of Role to be used for granting access to the Encryption Key. This is an ARN for AWS services and a Service Account Identifier for GCP.
     */
    roleId?: pulumi.Input<string>;
}
