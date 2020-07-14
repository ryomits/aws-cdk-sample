import { Construct } from "@aws-cdk/core";
import { Vpc, DefaultInstanceTenancy, SubnetType } from "@aws-cdk/aws-ec2";
import { Config } from "./config";

export class Network extends Construct {
    public readonly vpc: Vpc;

    constructor(scope: Construct, name: string, config: Config) {
        super(scope, name);

        this.vpc = new Vpc(scope, "VPC", {
            cidr: config.vpc.cidr,
            defaultInstanceTenancy: DefaultInstanceTenancy.DEFAULT,
            enableDnsSupport: true,
            enableDnsHostnames: true,
            subnetConfiguration: [
                {
                    name: "PublicSubnet",
                    cidrMask: 24,
                    subnetType: SubnetType.PUBLIC,
                },
                {
                    name: "ApplicationSubnet",
                    cidrMask: 24,
                    subnetType: SubnetType.PRIVATE,
                },
                {
                    name: "DatastoreSubnet",
                    cidrMask: 24,
                    subnetType: SubnetType.ISOLATED,
                },
            ],
            maxAzs: 2,
        });
    }
}
