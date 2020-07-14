import { Construct, SecretValue, Duration, ScopedAws } from "@aws-cdk/core";
import { Vpc, InstanceType, SecurityGroup, ISubnet } from "@aws-cdk/aws-ec2";
import { ParameterGroup, DatabaseInstance, DatabaseInstanceEngine, StorageType } from "@aws-cdk/aws-rds";
import { Config } from "./config";

export interface DatabaseProps {
    vpc: Vpc;
    securityGroups: SecurityGroup[];
    subnets: ISubnet[];
}

export class Database extends Construct {
    public readonly database: DatabaseInstance;

    constructor(scope: Construct, name: string, options: DatabaseProps, config: Config) {
        super(scope, name);

        const parameterGroup = new ParameterGroup(scope, "DatabaseParameterGroup", {
            family: "mysql5.7",
            parameters: {
                sql_mode: "IGNORE_SPACE",
                character_set_database: "utf8mb4",
                character_set_server: "utf8mb4",
                character_set_client: "utf8mb4",
                character_set_connection: "utf8mb4",
                character_set_results: "utf8mb4",
                time_zone: "Asia/Tokyo",
            },
        });
        const { stackName } = new ScopedAws(scope);
        this.database = new DatabaseInstance(scope, "DatabaseInstance", {
            allocatedStorage: config.database.allocatedStorage,
            allowMajorVersionUpgrade: false,
            instanceType: new InstanceType(config.database.instanceType),
            engine: DatabaseInstanceEngine.MYSQL,
            engineVersion: "5.7.23",
            masterUsername: config.database.username,
            masterUserPassword: new SecretValue(config.database.password),
            preferredBackupWindow: config.database.preferredBackupWindow,
            preferredMaintenanceWindow: config.database.preferredMaintenanceWindow,
            parameterGroup,
            vpc: options.vpc,
            securityGroups: options.securityGroups,
            vpcPlacement: {
                subnets: options.subnets,
            },
            storageType: StorageType.GP2,
            backupRetention: Duration.days(config.database.backupRetention),
            multiAz: config.database.multiAz,
            instanceIdentifier: stackName,
        });
    }
}
