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
    AuthorizationType,
    Model,
    JsonSchemaVersion,
    JsonSchemaType,
    RequestValidator
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
    private readonly JSON_CONTENT_TYPE = "application/json";
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
            apiKeySourceType: ApiKeySourceType.HEADER,
            // deployOptions: {
            //     methodOptions: {
            //         '/*': {
            //             throttlingBurstLimit: 100,
            //             throttlingRateLimit: 100
            //         }
            //     }
            // }
        });

        const authorizer = new CognitoUserPoolsAuthorizer(this, 'RestApiCognitoAuthorizer', {
            cognitoUserPools: [props.userPool]
            // {
            //   userPoolClient: userPoolClient,
            //   identitySource: ['$request.header.Authorization']
            // }
        });

        const apiKey = new ApiKey(this, 'RecipeApiDevApiKey', {
            apiKeyName: 'apiWebKey',
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
                    api: api
                }
            ],
        });
        usagePlan.addApiKey(apiKey);

        /* Request Models */
        const recipeRequestModel = this.addRecipeRequestModel(api);
        const ingredientRequestModel = this.addIngredientRequestModel(api);
        const instructionRequestModel = this.addInstructionRequestModel(api);

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
            authorizationType: AuthorizationType.COGNITO,
            requestValidator: new RequestValidator(this, 'CreateRecipeRequestBodyValidator', {
                validateRequestBody: true,
                restApi: api
            }),
            requestModels: {
                'application/json': recipeRequestModel
            }
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
            requestValidator: new RequestValidator(this, 'UpdateRecipeRequestBodyValidator', {
                validateRequestBody: true,
                restApi: api
            }),
            requestModels: {
                'application/json': recipeRequestModel
            },
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
            authorizationType: AuthorizationType.COGNITO,
            requestValidator: new RequestValidator(this, 'CreateIngredientRequestBodyValidator', {
                validateRequestBody: true,
                restApi: api
            }),
            requestModels: {
                'application/json': ingredientRequestModel
            }
        });

        const ingredientIdResource = ingredientResource.addResource("{ingredientId}");
        ingredientIdResource.addMethod("PUT", new LambdaIntegration(props.updateIngredientLambda), {
            requestParameters: {
                "method.request.path.ingredientId": true,
            },
            apiKeyRequired: true,
            authorizer: authorizer,
            authorizationType: AuthorizationType.COGNITO,
            requestValidator: new RequestValidator(this, 'UpdateIngredientRequestBodyValidator', {
                validateRequestBody: true,
                restApi: api
            }),
            requestModels: {
                'application/json': ingredientRequestModel
            }
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
            authorizationType: AuthorizationType.COGNITO,
            requestValidator: new RequestValidator(this, 'CreateInstructionRequestBodyValidator', {
                validateRequestBody: true,
                restApi: api
            }),
            requestModels: {
                'application/json': instructionRequestModel
            }
        });

        instructionIdResource
        .addMethod("PUT", new LambdaIntegration(props.updateInstructionLambda), {
            requestParameters: {
                "method.request.path.instructionId": true
            },
            apiKeyRequired: true,
            authorizer: authorizer,
            authorizationType: AuthorizationType.COGNITO,
            requestValidator: new RequestValidator(this, 'UpdateInstructionRequestBodyValidator', {
                validateRequestBody: true,
                restApi: api
            }),
            requestModels: {
                'application/json': instructionRequestModel
            }
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
    addRecipeRequestModel(api: RestApi): Model {
        const requestModel = api.addModel('RecipeRequestModel', {
            contentType: this.JSON_CONTENT_TYPE,
            modelName: "RecipeRequestModel",
            schema: {
                schema: JsonSchemaVersion.DRAFT4,
                title: "recipeRequest",
                type: JsonSchemaType.OBJECT,
                properties: {
                    name: {
                        type: JsonSchemaType.STRING,
                        maxLength: 500
                    },
                    description: {
                        type: JsonSchemaType.STRING
                    },
                    cookTime: {
                        type: JsonSchemaType.INTEGER
                    },
                    prepTime: {
                        type: JsonSchemaType.INTEGER
                    },
                    ingredients: {
                        type: JsonSchemaType.ARRAY,
                        items: {
                            type: JsonSchemaType.OBJECT,
                            properties: {
                                name: {
                                    type: JsonSchemaType.STRING
                                },
                                quantity: {
                                    type: JsonSchemaType.NUMBER
                                },
                                units: {
                                    type: JsonSchemaType.STRING,
                                    minLength: 0,
                                    maxLength: 100
                                },
                            }
                        },
                        minLength: 0
                    },
                    instructions: {
                        type: JsonSchemaType.ARRAY,
                        items: {
                            type: JsonSchemaType.OBJECT,
                            properties: {
                                order: {
                                    type: JsonSchemaType.INTEGER
                                },
                                step: {
                                    type: JsonSchemaType.STRING
                                }
                            }
                        },
                        minLength: 0
                    }
                }
            }
        });
        return requestModel;
    }
    addIngredientRequestModel(api: RestApi): Model {
        const requestModel = api.addModel('IngredientRequestModel', {
            contentType: this.JSON_CONTENT_TYPE,
            modelName: 'IngredientRequestModel',
            schema: {
                schema: JsonSchemaVersion.DRAFT4,
                title: "ingredientRequest",
                type: JsonSchemaType.OBJECT,
                properties: {
                    name: {
                        type: JsonSchemaType.STRING
                    },
                    quantity: {
                        type: JsonSchemaType.NUMBER
                    },
                    units: {
                        type: JsonSchemaType.STRING,
                        minLength: 0,
                        maxLength: 100
                    }
                }
            }
        });
        return requestModel;
    }
    addInstructionRequestModel(api: RestApi): Model {
        const requestModel = api.addModel('InstructionRequestModel', {
            contentType: this.JSON_CONTENT_TYPE,
            modelName: 'InstructionRequestModel',
            schema: {
                schema: JsonSchemaVersion.DRAFT4,
                title: 'instructionRequest',
                type: JsonSchemaType.OBJECT,
                properties: {
                    order: {
                        type: JsonSchemaType.INTEGER
                    },
                    step: {
                        type: JsonSchemaType.STRING
                    }
                }
            }
        });
        return requestModel;
    }
}