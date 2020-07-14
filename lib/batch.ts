import { Construct } from "@aws-cdk/core";
import { Vpc, SecurityGroup, Instance, InstanceType, MachineImage, EbsDeviceVolumeType, UserData, AmazonLinuxGeneration } from "@aws-cdk/aws-ec2";
import { Role } from "@aws-cdk/aws-iam";
import { Config } from "./config";

export interface BatchProps {
    vpc: Vpc;
    securityGroup: SecurityGroup;
    role: Role;
}

export class Batch extends Construct {
    constructor(scope: Construct, name: string, props: BatchProps, config: Config) {
        super(scope, name);

        const userData = UserData.forLinux({
            shebang: "#! /bin/bash -v",
        });
        userData.addCommands(
            "rpm -qi amazon-ssm-agent",
            "yum install -y https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_amd64/amazon-ssm-agent.rpm",
            "rpm -qi amazon-ssm-agent | grep ^Version"
        );
        new Instance(scope, "BatchInstance", {
            machineImage: MachineImage.latestAmazonLinux({
                generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
            }),
            vpc: props.vpc,
            instanceType: new InstanceType(config.batchInstance.instanceType),
            securityGroup: props.securityGroup,
            blockDevices: [
                {
                    deviceName: "/dev/xvda",
                    volume: {
                        ebsDevice: {
                            deleteOnTermination: true,
                            volumeSize: config.batchInstance.volumeSize,
                            volumeType: EbsDeviceVolumeType.GP2,
                        },
                    },
                },
            ],
            vpcSubnets: {
                subnets: props.vpc.privateSubnets,
            },
            keyName: config.batchInstance.keyName,
            role: props.role,
            userData,
        });
    }
}
