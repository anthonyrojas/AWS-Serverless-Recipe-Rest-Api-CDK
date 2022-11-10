import * as cdk from 'aws-cdk-lib';
import {
  RestApi,
  LambdaIntegration,
  Period,
  ApiKey,
  ApiKeySourceType,
  CognitoUserPoolsAuthorizer,
  AuthorizationType
} from 'aws-cdk-lib/aws-apigateway';
import {
  Table,
  AttributeType
} from 'aws-cdk-lib/aws-dynamodb'
import {
  Runtime
} from 'aws-cdk-lib/aws-lambda';
import {
  NodejsFunction
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { 
  Construct 
} from 'constructs';
import {
  Bucket
} from 'aws-cdk-lib/aws-s3';
import {
  UserPool,
  UserPoolClient,
  AccountRecovery,
  UserPoolClientIdentityProvider,
  UserPoolEmail,
} from 'aws-cdk-lib/aws-cognito'
import * as path from 'path'

export class ServerlessRestApiStack extends cdk.Stack {

  private readonly LAMBDA_RUNTIME = Runtime.NODEJS_16_X;
  public readonly API_NAME: string = "RecipeHttpApi";

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const {recipesTable} = this.addDynamoDbTables();
    //define recipe lambda resources
    const recipeLambdas = this.addRecipeLambdas(recipesTable);
    const createRecipeLambda: NodejsFunction = recipeLambdas['create-recipe'];
    const getRecipeLambda: NodejsFunction = recipeLambdas['get-recipe'];
    const updateRecipeLambda: NodejsFunction = recipeLambdas['update-recipe'];
    const deleteRecipeLambda: NodejsFunction = recipeLambdas['delete-recipe'];

    //grant dynamo permissions to recipe lambda functions
    recipesTable.grantReadData(getRecipeLambda);
    recipesTable.grantWriteData(createRecipeLambda);
    recipesTable.grantReadWriteData(deleteRecipeLambda);
    recipesTable.grantReadWriteData(updateRecipeLambda);

    //define ingredient lambda resources
    const ingredientLambdas = this.addIngredientLambdas(recipesTable);
    const createIngredientLambda: NodejsFunction = ingredientLambdas['create-ingredient'];
    const updateIngredientLambda: NodejsFunction = ingredientLambdas['update-ingredient'];
    const deleteIngredientLambda: NodejsFunction = ingredientLambdas['delete-ingredient'];

    //grant DDB permissions to ingredient lambda functions
    recipesTable.grantReadWriteData(createIngredientLambda);
    recipesTable.grantReadWriteData(updateIngredientLambda);
    recipesTable.grantReadWriteData(deleteIngredientLambda);

    const {userPool} = this.addCognitoResources();

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
      cognitoUserPools: [userPool]
      // {
      //   userPoolClient: userPoolClient,
      //   identitySource: ['$request.header.Authorization']
      // }
    });

    const apiKey = new ApiKey(this, 'RecipeApiDevApiKey', {
      apiKeyName: 'devKey'
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
    .addMethod('GET', new LambdaIntegration(getRecipeLambda), {
      apiKeyRequired: true
    });
    
    const recipeResource = api.root.addResource('recipe');
    const recipeIdResource = recipeResource.addResource("{recipeId}");
    // const instructionsResource = recipeIdResource.addResource("instructions");
    // const instructionResource = recipeIdResource.addResource("instruction");
    const ingredientResource = recipeIdResource.addResource("ingredient")
    
    /* Recipe Routes */
    recipeResource
    .addMethod('POST', new LambdaIntegration(createRecipeLambda), {
      apiKeyRequired: true,
      authorizer: authorizer,
      authorizationType: AuthorizationType.COGNITO
    });

    recipeIdResource
    .addMethod('GET', new LambdaIntegration(getRecipeLambda), {
      requestParameters: {
        "method.request.path.recipeId": true
      },
      apiKeyRequired: true
    });

    recipeIdResource
    .addMethod('PUT', new LambdaIntegration(updateRecipeLambda), {
      requestParameters: {
        "method.request.path.recipeId": true
      },
      apiKeyRequired: true,
      authorizer: authorizer,
      authorizationType: AuthorizationType.COGNITO
    });

    recipeIdResource
    .addMethod('DELETE', new LambdaIntegration(deleteRecipeLambda), {
      requestParameters: {
        "method.request.path.recipeId": true
      },
      apiKeyRequired: true,
      authorizer: authorizer,
      authorizationType: AuthorizationType.COGNITO
    });

    /* Ingredient Routes */
    ingredientResource
    .addMethod('POST', new LambdaIntegration(createIngredientLambda), {
      apiKeyRequired: true,
      authorizer: authorizer,
      authorizationType: AuthorizationType.COGNITO
    });

    const ingredientIdResource = ingredientResource.addResource("{ingredientId}");
    ingredientIdResource.addMethod("PUT", new LambdaIntegration(updateIngredientLambda), {
      requestParameters: {
        "method.request.path.ingredientId": true,
      },
      apiKeyRequired: true,
      authorizer: authorizer,
      authorizationType: AuthorizationType.COGNITO
    });
    
    ingredientIdResource
    .addMethod("DELETE", new LambdaIntegration(deleteIngredientLambda), {
      requestParameters: {
        "method.request.path.ingredientId": true
      },
      apiKeyRequired: true,
      authorizer: authorizer,
      authorizationType: AuthorizationType.COGNITO
    });

    /* Instruction Routes  */

  }
  addCognitoResources() {
    const userPool = new UserPool(this, 'RecipeApiUserPool', {
      userPoolName: 'recipe-api-user-pool',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      selfSignUpEnabled: true,
      signInAliases: {email: true},
      autoVerify: {email: true},
      passwordPolicy: {
        minLength: 6
      },
      standardAttributes: {
        givenName: {
          mutable: true,
          required: true
        },
        familyName: {
          required: true,
          mutable: true
        },
        preferredUsername: {
          mutable: true,
          required: true
        },
        profilePicture: {
          mutable: true,
          required: false
        },
        birthdate: {
          mutable: true,
          required: true
        }
      },
      email: UserPoolEmail.withCognito(),
      accountRecovery: AccountRecovery.EMAIL_ONLY
    });
    const userPoolDomain = userPool.addDomain('RecipeApiUserPoolDomain', {
      cognitoDomain: {
        domainPrefix: 'serverlessrecipeapiauth'
      }
    });
    const userPoolClient: UserPoolClient = userPool.addClient('RecipeApiUserPoolClient', {
      userPoolClientName: 'RecipeApiUserPoolClient',
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
        custom: true,
        userSrp: true,
      },
      supportedIdentityProviders: [
        UserPoolClientIdentityProvider.COGNITO
      ],
      oAuth: {
        flows: {
          implicitCodeGrant: true,
          authorizationCodeGrant: false,
          clientCredentials: false
        }
      },
    });
    return {
      userPool,
      userPoolClient,
      userPoolDomain
    }
  }
  addDynamoDbTables() {
    const recipesTable = new Table(this, 'RecipesApiTable', {
      //tableName: 'Recipes',
      partitionKey: {
        name: "recipeId",
        type: AttributeType.STRING
      },
      sortKey: {
        name: "itemId", //will contain userId and unique id of ingredient and instructions
        type: AttributeType.STRING
      }
    });
    recipesTable.addGlobalSecondaryIndex({
      indexName: "UserItemIndex",
      partitionKey: {
        name: "userId",
        type: AttributeType.STRING
      },
      sortKey: {
        name: "itemId",
        type: AttributeType.STRING
      }
    });
    return {
      recipesTable
    }
  }
  addRecipeLambdas(recipeTable: Table): Record<string, NodejsFunction> {
    const functionSpecs = [
      {
        name: 'get-recipe',
        description: 'Lambda function to retrieve a recipe or list of recipes from DynamoDB',
        memorySize: 256
      },
      {
        name: 'create-recipe',
        description: 'Lambda function to create a recipe and insert it into DynamoDB',
        memorySize: 128
      },
      {
        name: 'delete-recipe',
        description: 'Lambda function to delete a recipe from DynamoDB',
        memorySize: 128
      },
      {
        name: 'update-recipe',
        description: 'Lambda function to update recipe in DynamoDB',
        memorySize: 128
      }
    ];
    const functions: Record<string, NodejsFunction> = {}
    functionSpecs.forEach(functionSpec => {
      const lambda: NodejsFunction = new NodejsFunction(this, functionSpec.name, {
        environment: {
          RECIPES_TABLE_NAME: recipeTable.tableName
        },
        memorySize: functionSpec.memorySize,
        timeout: cdk.Duration.seconds(10),
        description: functionSpec.description,
        runtime: this.LAMBDA_RUNTIME,
        handler: 'handler',
        entry: path.join(__dirname, `/../src/recipe/${functionSpec.name}/index.ts`)
      })
      functions[functionSpec.name] = lambda;
    });
    return functions;
  }
  addIngredientLambdas(recipesTable: Table): Record<string, NodejsFunction> {
    const functionSpecs = [
      {
        name: 'create-ingredient',
        description: 'Lambda function to add an ingredient to an existing recipe',
        memorySize: 128
      },
      {
        name: 'delete-ingredient',
        description: 'Lambda function to delete an ingredient for an existing recipe',
        memorySize: 128
      },
      {
        name: 'update-ingredient',
        description: 'Lambda function to update an ingredient for an existing recipe',
        memorySize: 128
      }
    ];
    const functions: Record<string, NodejsFunction> = {};
    functionSpecs.forEach(functionSpec => {
      const lambda: NodejsFunction = new NodejsFunction(this, functionSpec.name, {
        environment: {
          RECIPES_TABLE_NAME: recipesTable.tableName
        },
        memorySize: functionSpec.memorySize,
        timeout: cdk.Duration.seconds(10),
        description: functionSpec.description,
        runtime: this.LAMBDA_RUNTIME,
        handler: 'handler',
        entry: path.join(__dirname, `/../src/ingredient/${functionSpec.name}/index.ts`)
      });
      functions[functionSpec.name] = lambda;
    });
    return functions;
  }
  addInstructionLambdas(recipesTable: Table): Record<string, NodejsFunction> {
    const functionSpecs = [
      {
        name: 'create-instruction',
        description: 'Lambda function to add an instruction to an existing recipe',
        memorySize: 128
      },
      {
        name: 'update-instruction',
        description: 'Lambda function to update an instruction for an existing recipe',
        memorySize: 128
      },
      {
        name: 'delete-instruction',
        description: 'Lambda function to delete an instruction for an existing recipe',
        memorySize: 128
      }
    ];
    const functions: Record<string, NodejsFunction> = {};
    functionSpecs.forEach(functionSpec => {
      const lambda = new NodejsFunction(this, functionSpec.name, {
        environment: {
          RECIPES_TABLE_NAME: recipesTable.tableName
        },
        memorySize: functionSpec.memorySize,
        timeout: cdk.Duration.seconds(10),
        description: functionSpec.description,
        runtime: this.LAMBDA_RUNTIME,
        handler: 'handler',
        entry: path.join(__dirname, `/../src/recipe/${functionSpec.name}/index.ts`)
      });
      functions[functionSpec.name] = lambda;
    });
    return functions;
  }
  addRecipePictureBucket() {
    return new Bucket(this, 'RecipePicturesBucket', {
      bucketName: "recipeapiimages",
      publicReadAccess: true
    })
  }
}
