import { Construct } from "@aws-cdk/core";
import { Vpc, SecurityGroup, Instance, InstanceType, MachineImage, EbsDeviceVolumeType, UserData, AmazonLinuxGeneration } from "@aws-cdk/aws-ec2";
import { Role } from "@aws-cdk/aws-iam";
import { ApplicationLoadBalancer, SslPolicy, ApplicationProtocol, ListenerAction, ListenerCondition } from "@aws-cdk/aws-elasticloadbalancingv2";
import { InstanceTarget } from "@aws-cdk/aws-elasticloadbalancingv2-targets";
import { Config } from "./config";

export interface WebProps {
    vpc: Vpc;
    webSecurityGroup: SecurityGroup;
    applicationSecurityGroup: SecurityGroup;
    loadBalancerSecurityGroup: SecurityGroup;
    role: Role;
}

export class Web extends Construct {
    constructor(scope: Construct, name: string, props: WebProps, config: Config) {
        super(scope, name);

        const userData = UserData.forLinux({
            shebang: "#! /bin/bash -v",
        });
        userData.addCommands(
            "rpm -qi amazon-ssm-agent",
            "yum install -y https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_amd64/amazon-ssm-agent.rpm",
            "rpm -qi amazon-ssm-agent | grep ^Version"
        );
        const instance = new Instance(scope, "WebInstance", {
            machineImage: MachineImage.latestAmazonLinux({
                generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
            }),
            vpc: props.vpc,
            instanceType: new InstanceType(config.webInstance.instanceType),
            securityGroup: props.webSecurityGroup,
            blockDevices: [
                {
                    deviceName: "/dev/xvda",
                    volume: {
                        ebsDevice: {
                            deleteOnTermination: true,
                            volumeSize: config.webInstance.volumeSize,
                            volumeType: EbsDeviceVolumeType.GP2,
                        },
                    },
                },
            ],
            vpcSubnets: {
                subnets: props.vpc.privateSubnets,
            },
            keyName: config.webInstance.keyName,
            role: props.role,
            userData,
        });
        instance.addSecurityGroup(props.applicationSecurityGroup);

        const applicationLoadBalancer = new ApplicationLoadBalancer(scope, "WebApplicationLoadBalancer", {
            vpc: props.vpc,
            internetFacing: true,
            securityGroup: props.loadBalancerSecurityGroup,
            vpcSubnets: {
                subnets: props.vpc.publicSubnets,
            },
        });
        const listener = applicationLoadBalancer.addListener("WebHTTPSListener", {
            sslPolicy: SslPolicy.TLS12_EXT,
            port: 443,
            protocol: ApplicationProtocol.HTTPS,
            certificateArns: [config.certificate.apNortheastOneCertificateArn],
            defaultAction: ListenerAction.fixedResponse(410, {
                contentType: "text/plain",
            }),
        });
        listener.addTargets("WebBackendTargetGroup", {
            conditions: [ListenerCondition.hostHeaders([config.host]), ListenerCondition.pathPatterns(["/api*"])],
            targets: [new InstanceTarget(instance)],
            priority: 1,
            port: 80,
            protocol: ApplicationProtocol.HTTP,
        });
        listener.addTargets("WebFrontendTargetGroup", {
            conditions: [ListenerCondition.hostHeaders([config.host])],
            targets: [new InstanceTarget(instance)],
            priority: 2,
            port: 3000,
            protocol: ApplicationProtocol.HTTP,
        });
        applicationLoadBalancer.addListener("WebHTTPListener", {
            port: 80,
            protocol: ApplicationProtocol.HTTP,
            defaultAction: ListenerAction.redirect({
                host: "#{host}",
                path: "/#{path}",
                port: "443",
                protocol: "HTTPS",
                query: "#{query}",
                permanent: true,
            }),
        });
    }
}
