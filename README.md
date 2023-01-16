# Serverless Recipe Book API

## Overview

This is a serverless REST API run on API Gateway. This REST API serves the purpose of being a simple recipe book for multiple users. 

### Infrastructure as Code

This project uses AWS CDK V2 to build and deploy all necessary infrastructure, which include: 

* Cognito User Pool for authentication
* API Gateway for defining the API endpoints
* Request Models for each API endpoint for input validation
* DynamoDB for storing recipe data
* Lambda functions for compute

## Purpose

The purpose of this project was entirely for learning how to build a CDK project from beginning to end. There are numerous improvements that could be made to this, but that I won't explore at this time. However, I will take the learning experience from this and apply it to future CDK projects.

## Frontend

At this time, there is no frontend for this API. Building one should be fairly easy to create, but I've opted not to create one for this particular project.

## Useful commands

The `cdk.json` file tells the CDK Toolkit how to execute your app.

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
* `cdk bootstrap`   bootstrap the stack
