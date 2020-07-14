import * as cdk from "@aws-cdk/core";
import { Config } from "./config";
import { Network } from "./network";
import { Security } from "./security";
import { Database } from "./database";
import { Web } from "./web";
import { StaticResouceDistribution } from "./staticResourceDistribution";
import { InstanceRole } from "./instanceRole";

export class AwsCdkSample extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, config: Config, props?: cdk.StackProps) {
        super(scope, id, props);
        const network = new Network(this, "network", config);
        const security = new Security(this, "security", {
            vpc: network.vpc,
        });
        const distribution = new StaticResouceDistribution(this, "StaticResoucesBucket", config);
        const role = new InstanceRole(this, "InstanceRole", {
            bucket: distribution.bucket,
        });

        new Database(
            this,
            "Database",
            {
                securityGroups: [security.databaseSecurityGroup],
                subnets: network.vpc.isolatedSubnets,
                vpc: network.vpc,
            },
            config
        );

        new Web(
            this,
            "Web",
            {
                vpc: network.vpc,
                webSecurityGroup: security.webApplicationSecurityGroup,
                applicationSecurityGroup: security.applicationSecurityGroup,
                loadBalancerSecurityGroup: security.publicWebSecurityGroup,
                role: role.role,
            },
            config
        );
    }
}
