export interface CertificateConfig {
    apNortheastOneCertificateArn: string;
    usEastOneCertificateArn: string;
}

export interface VpcConfig {
    cidr: string;
}

export interface InstanceConfig {
    instanceType: string;
    volumeSize: number;
    keyName: string;
}

export interface DatabaseConfig {
    username: string;
    password: string;
    instanceType: string;
    allocatedStorage: number;
    preferredMaintenanceWindow: string;
    preferredBackupWindow: string;
    backupRetention: number;
    multiAz: boolean;
}

export interface Config {
    host: string;
    vpc: VpcConfig;
    webInstance: InstanceConfig;
    diagnosisInstance: InstanceConfig;
    batchInstance: InstanceConfig;
    database: DatabaseConfig;
    certificate: CertificateConfig;
    croudfrontStaticDomain: string;
}

function assert(value: any): string {
    if (!value) {
        throw new Error("Invalid string input");
    }
    return value;
}

export function getConfig(): Config {
    return {
        host: assert(process.env.HOST),
        vpc: {
            cidr: assert(process.env.VPC_CIDR),
        },
        webInstance: {
            instanceType: assert(process.env.WEB_INSTANCE_TYPE),
            volumeSize: Number(assert(process.env.WEB_INSTANCE_VOLUME_SIZE)),
            keyName: assert(process.env.WEB_INSTANCE_KEY_NAME),
        },
        diagnosisInstance: {
            instanceType: assert(process.env.DIAGNOSIS_INSTANCE_TYPE),
            volumeSize: Number(assert(process.env.DIAGNOSIS_INSTANCE_VOLUME_SIZE)),
            keyName: assert(process.env.DIAGNOSIS_INSTANCE_KEY_NAME),
        },
        batchInstance: {
            instanceType: assert(process.env.BATCH_INSTANCE_TYPE),
            volumeSize: Number(assert(process.env.BATCH_INSTANCE_VOLUME_SIZE)),
            keyName: assert(process.env.BATCH_INSTANCE_KEY_NAME),
        },
        database: {
            instanceType: assert(process.env.DATABASE_INSTANCE_TYPE),
            allocatedStorage: Number(assert(process.env.DATABASE_ALLOCATED_STORAGE)),
            password: assert(process.env.DATABASE_PASSWORD),
            username: assert(process.env.DATABASE_USER),
            preferredBackupWindow: assert(process.env.DATABASE_PREFERRED_BACKUP_WINDOW),
            preferredMaintenanceWindow: assert(process.env.DATABASE_PREFERRED_MAINTENANCE_WINDOW),
            backupRetention: Number(assert(process.env.DATABASE_BACKUP_RETENTION)),
            multiAz: assert(process.env.DATABASE_MULTI_AZ) === "true",
        },
        certificate: {
            apNortheastOneCertificateArn: assert(process.env.CERTIFICATE_ARN_AP_NORTHEAST_ONE),
            usEastOneCertificateArn: assert(process.env.CERTIFICATE_ARN_US_EAST_ONE),
        },
        croudfrontStaticDomain: assert(process.env.CLOUDFRONT_STATIC_DOMAIN),
    };
}
