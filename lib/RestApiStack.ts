import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
    RestApi,
    LambdaIntegration,
    Period,
    ApiKey,
    ApiKeySourceType,
    CognitoUserPoolsAuthorizer,
    AuthorizationType
} from 'aws-cdk-lib/aws-apigateway';

interface RestApiStackProps extends cdk.StackProps {
    readonly createRecipeLambda: NodejsFunction;
    readonly updateRecipeLambda: NodejsFunction;
    readonly getRecipeLambda: NodejsFunction;
    readonly deleteRecipeLambda: NodejsFunction;
    readonly createIngredientLambda: NodejsFunction;
    readonly updateIngredientLambda: NodejsFunction;
    readonly deleteIngredientLambda: NodejsFunction;
    readonly createInstructionLambda: NodejsFunction;
    readonly updateInstructionLambda: NodejsFunction;
    readonly deleteInstructionLambda: NodejsFunction;
    readonly userPool: UserPool;
}

export class RestApiStack extends cdk.Stack {
    private readonly API_NAME: string = "RecipeRestApi";
    constructor(scope: Construct, id: string, props: RestApiStackProps) {
        super(scope, id, props);
        const api = new RestApi(this, this.API_NAME, {
            description: 'Sample REST API created by CDK template for simple recipe API',
            defaultCorsPreflightOptions:{
                allowOrigins: ["*"],
                allowCredentials: true,
                allowHeaders: [
                    'Content-Type',
                    'X-Api-Key',
                    'Authorization',
                    'X-Amzn-Date'
                ],
                allowMethods: [
                    'GET',
                    'DELETE',
                    'POST',
                    'PUT',
                    'OPTIONS'
                ]
            },
            apiKeySourceType: ApiKeySourceType.HEADER
        });

        const authorizer = new CognitoUserPoolsAuthorizer(this, 'RestApiCognitoAuthorizer', {
            cognitoUserPools: [props.userPool]
            // {
            //   userPoolClient: userPoolClient,
            //   identitySource: ['$request.header.Authorization']
            // }
        });

        const apiKey = new ApiKey(this, 'RecipeApiDevApiKey', {
            apiKeyName: 'apiWebKey'
        })

        const usagePlan = api.addUsagePlan('RecipeApiUsagePlan', {
            description: "Usage plan for rate limiting the recipe API",
            throttle: {
                rateLimit: 100,
                burstLimit: 100
            },
            quota: {
                limit: 2500, 
                period: Period.MONTH
            },
            apiStages: [
                {
                    stage: api.deploymentStage,
                    api: api,
                }
            ],
        });
        usagePlan.addApiKey(apiKey);


        /* Add routes with lambda handlers */
        api.root
        .addResource('recipes')
        .addMethod('GET', new LambdaIntegration(props.getRecipeLambda), {
            apiKeyRequired: true
        });

        const recipeResource = api.root.addResource('recipe');
        const recipeIdResource = recipeResource.addResource("{recipeId}");
        const instructionResource = recipeIdResource.addResource("instruction");
        const instructionIdResource = instructionResource.addResource("{instructionId}");
        const ingredientResource = recipeIdResource.addResource("ingredient")

        /* Recipe Routes */
        recipeResource
        .addMethod('POST', new LambdaIntegration(props.createRecipeLambda), {
            apiKeyRequired: true,
            authorizer: authorizer,
            authorizationType: AuthorizationType.COGNITO
        });

        recipeIdResource
        .addMethod('GET', new LambdaIntegration(props.getRecipeLambda), {
            requestParameters: {
                "method.request.path.recipeId": true
            },
            apiKeyRequired: true
        });

        recipeIdResource
        .addMethod('PUT', new LambdaIntegration(props.updateRecipeLambda), {
            requestParameters: {
                "method.request.path.recipeId": true
            },
            apiKeyRequired: true,
            authorizer: authorizer,
            authorizationType: AuthorizationType.COGNITO
        });

        recipeIdResource
        .addMethod('DELETE', new LambdaIntegration(props.deleteRecipeLambda), {
            requestParameters: {
                "method.request.path.recipeId": true
            },
            apiKeyRequired: true,
            authorizer: authorizer,
            authorizationType: AuthorizationType.COGNITO
        });

        /* Ingredient Routes */
        ingredientResource
        .addMethod('POST', new LambdaIntegration(props.createIngredientLambda), {
            apiKeyRequired: true,
            authorizer: authorizer,
            authorizationType: AuthorizationType.COGNITO
        });

        const ingredientIdResource = ingredientResource.addResource("{ingredientId}");
        ingredientIdResource.addMethod("PUT", new LambdaIntegration(props.updateIngredientLambda), {
            requestParameters: {
                "method.request.path.ingredientId": true,
            },
            apiKeyRequired: true,
            authorizer: authorizer,
            authorizationType: AuthorizationType.COGNITO
        });

        ingredientIdResource
        .addMethod("DELETE", new LambdaIntegration(props.deleteIngredientLambda), {
            requestParameters: {
                "method.request.path.ingredientId": true
            },
            apiKeyRequired: true,
            authorizer: authorizer,
            authorizationType: AuthorizationType.COGNITO
        });

        /* Instruction Routes  */
        instructionResource
        .addMethod("POST", new LambdaIntegration(props.createInstructionLambda), {
            apiKeyRequired: true,
            authorizer: authorizer,
            authorizationType: AuthorizationType.COGNITO
        });

        instructionIdResource
        .addMethod("PUT", new LambdaIntegration(props.updateInstructionLambda), {
            requestParameters: {
                "method.request.path.instructionId": true
            },
            apiKeyRequired: true,
            authorizer: authorizer,
            authorizationType: AuthorizationType.COGNITO
        });

        instructionIdResource
        .addMethod("DELETE", new LambdaIntegration(props.deleteInstructionLambda), {
            requestParameters: {
                "method.request.path.instructionId": true
            },
            apiKeyRequired: true,
            authorizer: authorizer,
            authorizationType: AuthorizationType.COGNITO
        });
    }
}