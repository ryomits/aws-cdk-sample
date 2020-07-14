import { Construct } from "@aws-cdk/core";
import { Role, ServicePrincipal, Policy, PolicyStatement, Effect } from "@aws-cdk/aws-iam";
import { Bucket } from "@aws-cdk/aws-s3";

export interface RoleProps {
    bucket: Bucket;
}

export class InstanceRole extends Construct {
    public readonly role: Role;

    constructor(scope: Construct, name: string, props: RoleProps) {
        super(scope, name);

        this.role = new Role(scope, "IAMRole", {
            assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
            path: "/",
        });

        const ssmPolicyStatement = new PolicyStatement({
            effect: Effect.ALLOW,
        });
        ssmPolicyStatement.addActions(
            "ssm:UpdateInstanceInformation",
            "ssmmessages:CreateControlChannel",
            "ssmmessages:CreateDataChannel",
            "ssmmessages:OpenControlChannel",
            "ssmmessages:OpenDataChannel"
        );
        ssmPolicyStatement.addResources("*");
        const s3EncryptionPolicyStatement = new PolicyStatement({
            effect: Effect.ALLOW,
        });
        s3EncryptionPolicyStatement.addActions("s3:GetEncryptionConfiguration");
        s3EncryptionPolicyStatement.addResources("*");
        const s3PolicyStatement = new PolicyStatement({
            effect: Effect.ALLOW,
        });
        s3PolicyStatement.addActions("s3:GetObject", "s3:PutObject", "s3:DeleteObject");
        s3PolicyStatement.addResources(`${props.bucket.bucketArn}/*`);
        new Policy(scope, "Policy", {
            statements: [ssmPolicyStatement, s3EncryptionPolicyStatement, s3PolicyStatement],
            roles: [this.role],
        });
    }
}
