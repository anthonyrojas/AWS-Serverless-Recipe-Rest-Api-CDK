import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket } from 'aws-cdk-lib/aws-s3';

export class StorageStack extends cdk.Stack {
    public readonly recipeImageBucket: Bucket;
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        /* Bucket to store images for recipes */
        this.recipeImageBucket = new Bucket(this, 'RecipeImagesBucket', {
            publicReadAccess: true,
            bucketKeyEnabled: true
        });
    }
}