#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsCdkSample } from '../lib/aws-cdk-sample';
import { getConfig } from '../lib/config';

const env = process.env.NODE_ENV ||'development';
const config = getConfig();

const app = new cdk.App();
new AwsCdkSample(app, `AwsCdkSample-${env}`, config, {
    env: {
        account: "",
        region: "ap-northeast-1",
    }
});
