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

  public readonly API_NAME: string = "RecipeHttpApi";

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const {recipesTable} = this.addDynamoDbTables();
    //define lambda resources
    const createRecipeLambda: NodejsFunction = this.addCreateRecipeLambda(recipesTable);
    const getRecipeLambda: NodejsFunction = this.addGetRecipeLambda(recipesTable);
    const updateRecipeLambda: NodejsFunction = this.addUpdateRecipeLambda(recipesTable);
    const deleteRecipeLambda: NodejsFunction = this.addDeleteRecipeLambda(recipesTable);
    //grant dynamo permissions to lambda functions
    recipesTable.grantReadData(getRecipeLambda);

    recipesTable.grantWriteData(createRecipeLambda);
    
    recipesTable.grantReadWriteData(deleteRecipeLambda);
    
    recipesTable.grantReadWriteData(updateRecipeLambda);

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
        limit: 1000, 
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
    const recipeIdResource = recipeResource.addResource("{id}");
    const instructionsResource = recipeIdResource.addResource("instructions");
    //const ingredientsResource = recipeIdResource.addResource("ingredients");
    const instructionResource = recipeIdResource.addResource("instruction");
    const ingredientResource = recipeIdResource.addResource("ingredient")
    
    recipeResource
    .addMethod('POST', new LambdaIntegration(createRecipeLambda), {
      apiKeyRequired: true,
      authorizer: authorizer,
      authorizationType: AuthorizationType.COGNITO
    });
    
    recipeIdResource
    .addMethod('GET', new LambdaIntegration(getRecipeLambda), {
      requestParameters: {
        "method.request.path.id": true
      },
      apiKeyRequired: true
    });

    recipeIdResource
    .addMethod('PUT', new LambdaIntegration(updateRecipeLambda), {
      requestParameters: {
        "method.request.path.id": true
      },
      apiKeyRequired: true,
      authorizer: authorizer,
      authorizationType: AuthorizationType.COGNITO
    });

    recipeIdResource
    .addMethod('DELETE', new LambdaIntegration(deleteRecipeLambda), {
      requestParameters: {
        "method.request.path.id": true
      },
      apiKeyRequired: true,
      authorizer: authorizer,
      authorizationType: AuthorizationType.COGNITO
    })
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
    const recipesTable = new Table(this, 'RecipesTable', {
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
      indexName: "UserIndex",
      partitionKey: {
        name: "itemId", //contains userId
        type: AttributeType.STRING
      },
      sortKey: {
        name: "recipeId",
        type: AttributeType.STRING
      }
    })
    return {
      recipesTable
    }
  }
  addGetRecipeLambda(recipesTable: Table): NodejsFunction {
    const getRecipeLambda = new NodejsFunction(this, 'get-recipe', {
      environment: {
        RECIPES_TABLE_NAME: recipesTable.tableName
      },
      memorySize: 256,
      timeout: cdk.Duration.seconds(15),
      description: 'Lambda function to retrieve a recipe or list of recipes from DynamoDB',
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      entry: path.join(__dirname, '/../src/get-recipe/index.ts')
    });
    return getRecipeLambda;
  }
  addCreateRecipeLambda(recipesTable: Table): NodejsFunction {
    const createRecipeLambda = new NodejsFunction(this, 'create-recipe', {
      environment: {
        RECIPES_TABLE_NAME: recipesTable.tableName
      },
      memorySize: 128,
      timeout: cdk.Duration.seconds(15),
      description: 'Lambda function to create a recipe and insert it into DynamoDB',
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      entry: path.join(__dirname, '/../src/create-recipe/index.ts')
    });
    return createRecipeLambda;
  }
  addDeleteRecipeLambda(recipesTable: Table): NodejsFunction {
    return new NodejsFunction(this, 'delete-recipe', {
      environment: {
        RECIPES_TABLE_NAME: recipesTable.tableName
      },
      memorySize: 128,
      timeout: cdk.Duration.seconds(15),
      description: 'Lambda function to delete a recipe from DynamoDB',
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      entry: path.join(__dirname, "/../src/delete-recipe/index.ts")
    });
  }
  addUpdateRecipeLambda(recipesTable: Table): NodejsFunction {
    return new NodejsFunction(this, 'update-recipe', {
      environment: {
        RECIPES_TABLE_NAME: recipesTable.tableName
      },
      memorySize: 128,
      timeout: cdk.Duration.seconds(15),
      description: 'Lambda function to update recipe in DynamoDB',
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      entry: path.join(__dirname, '/../src/update-recipe/index.ts')
    })
  }
  addRecipePictureBucket() {
    return new Bucket(this, 'RecipePicturesBucket', {
      bucketName: "recipeapiimages",
      publicReadAccess: true
    })
  }
}
