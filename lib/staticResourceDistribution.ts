import { Construct, Aws, Duration } from "@aws-cdk/core";
import { Bucket, HttpMethods, BucketAccessControl } from "@aws-cdk/aws-s3";
import { PolicyStatement, Effect, CanonicalUserPrincipal } from "@aws-cdk/aws-iam";
import { OriginAccessIdentity, CloudFrontWebDistribution, ViewerProtocolPolicy, CloudFrontAllowedMethods, SSLMethod } from "@aws-cdk/aws-cloudfront";
import { HostedZone, ARecord, RecordTarget } from "@aws-cdk/aws-route53";
import { CloudFrontTarget } from "@aws-cdk/aws-route53-targets";
import { Config } from "./config";

export class StaticResouceDistribution extends Construct {
    public readonly bucket: Bucket;

    constructor(scope: Construct, name: string, config: Config) {
        super(scope, name);

        this.bucket = new Bucket(this, "StaticResourceBucket", {
            versioned: false,
            accessControl: BucketAccessControl.PRIVATE,
            cors: [
                {
                    allowedHeaders: ["*", "Authorization"],
                    allowedMethods: [HttpMethods.GET, HttpMethods.HEAD],
                    allowedOrigins: [`https://${config.host}`],
                    maxAge: 3000,
                },
            ],
        });

        const staticResourceCloudFrontOriginAccessIdentity = new OriginAccessIdentity(this, "StaticResourceCloudFrontOriginAccessIdentity", {
            comment: Aws.STACK_NAME,
        });

        const staticResourcePolicy = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["s3:GetObject"],
            principals: [new CanonicalUserPrincipal(staticResourceCloudFrontOriginAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
            resources: [`${this.bucket.bucketArn}/*`],
        });
        this.bucket.addToResourcePolicy(staticResourcePolicy);

        const staticResourceDistribution = new CloudFrontWebDistribution(this, "StaticResourceDistribution", {
            comment: Aws.STACK_NAME,
            defaultRootObject: "index.html",
            viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
            originConfigs: [
                {
                    s3OriginSource: {
                        s3BucketSource: this.bucket,
                    },
                    behaviors: [
                        {
                            trustedSigners: [Aws.ACCOUNT_ID],
                            isDefaultBehavior: true,
                            defaultTtl: Duration.days(1),
                            minTtl: Duration.seconds(0),
                            maxTtl: Duration.days(365),
                            forwardedValues: {
                                headers: ["Origin"],
                                queryString: false,
                            },
                            allowedMethods: CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
                        },
                    ],
                },
            ],
            viewerCertificate: {
                aliases: [config.croudfrontStaticDomain],
                props: {
                    acmCertificateArn: config.certificate.usEastOneCertificateArn,
                    sslSupportMethod: SSLMethod.SNI,
                    minimumProtocolVersion: "TLSv1.2_2018",
                },
            },
        });

        const zone = HostedZone.fromLookup(scope, "HostedZone", {
            domainName: "",
        });
        new ARecord(scope, "StaticResoucesDistributionAliasRecord", {
            zone,
            recordName: config.croudfrontStaticDomain,
            target: RecordTarget.fromAlias(new CloudFrontTarget(staticResourceDistribution)),
        });
    }
}
