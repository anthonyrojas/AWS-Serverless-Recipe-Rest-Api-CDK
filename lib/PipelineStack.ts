import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { 
    CodePipeline,
    CodePipelineSource,
    ShellStep
} from 'aws-cdk-lib/pipelines';
import { ServerlessRecipeApiPipelineStage } from './ServerlessRecipeApiPipelineStage';
import { SecretValue } from 'aws-cdk-lib';

export class PipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: cdk.StackProps) {
        super(scope, id, props);
        const pipeline = new CodePipeline(this, 'ServerlessRecipeApiPipeline', {
            synth: new ShellStep('Synth', {
                input: CodePipelineSource.gitHub('anthonyrojas/AWS-Serverless-Recipe-Rest-Api-CDK', 'main', {
                    authentication: SecretValue.secretsManager("serverless-recipe-app-github-token")
                }),
                commands: [
                    "npm install",
                    'npm ci',
                    'npm run test',
                    'npm run build',
                    'npx cdk synth'
                ],
                primaryOutputDirectory: 'cdk.out'
            }), 
            dockerEnabledForSynth: true,
            dockerEnabledForSelfMutation: true
        });

        pipeline.addStage(new ServerlessRecipeApiPipelineStage(this, 'ProdStage', {
            env: {
                region: 'us-west-2'
            }
        }));
    }
}