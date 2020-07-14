import { Construct } from "@aws-cdk/core";
import { Vpc, SecurityGroup, Peer, Port } from "@aws-cdk/aws-ec2";

export interface SecurityProps {
    vpc: Vpc;
}

export class Security extends Construct {
    public readonly publicWebSecurityGroup: SecurityGroup;
    public readonly webApplicationSecurityGroup: SecurityGroup;
    public readonly applicationSecurityGroup: SecurityGroup;
    public readonly privateWebSecurityGroup: SecurityGroup;
    public readonly diagnosisApplicationSecurityGroup: SecurityGroup;
    public readonly databaseSecurityGroup: SecurityGroup;

    constructor(scope: Construct, name: string, props: SecurityProps) {
        super(scope, name);

        this.publicWebSecurityGroup = new SecurityGroup(scope, "PublicWebSecurityGroup", {
            vpc: props.vpc,
            allowAllOutbound: true,
        });
        this.publicWebSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80));
        this.publicWebSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(443));

        this.webApplicationSecurityGroup = new SecurityGroup(scope, "WebApplicationSecurityGroup", {
            vpc: props.vpc,
            allowAllOutbound: true,
        });
        this.webApplicationSecurityGroup.addIngressRule(this.publicWebSecurityGroup, Port.tcp(80));
        this.webApplicationSecurityGroup.addIngressRule(this.publicWebSecurityGroup, Port.tcp(3000));

        this.applicationSecurityGroup = new SecurityGroup(scope, "ApplicationSecurityGroup", {
            vpc: props.vpc,
            allowAllOutbound: true,
        });

        this.privateWebSecurityGroup = new SecurityGroup(scope, "PrivateWebSecurityGroup", {
            vpc: props.vpc,
            allowAllOutbound: true,
        });
        this.privateWebSecurityGroup.addIngressRule(this.applicationSecurityGroup, Port.tcp(80));

        this.diagnosisApplicationSecurityGroup = new SecurityGroup(scope, "DiagnosisApplicationSecurityGroup", {
            vpc: props.vpc,
            allowAllOutbound: true,
        });
        this.diagnosisApplicationSecurityGroup.addIngressRule(this.privateWebSecurityGroup, Port.tcp(4000));

        this.databaseSecurityGroup = new SecurityGroup(scope, "DatabaseSecurityGroup", {
            vpc: props.vpc,
            allowAllOutbound: true,
        });
        this.databaseSecurityGroup.addIngressRule(this.applicationSecurityGroup, Port.tcp(3306));
    }
}
