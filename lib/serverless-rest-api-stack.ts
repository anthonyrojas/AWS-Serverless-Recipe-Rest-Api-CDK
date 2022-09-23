import * as cdk from 'aws-cdk-lib';
import {
  RestApi,
  //LambdaRestApi,
  LambdaIntegration,
  Period,
  ApiKey,
  ApiKeySourceType
} from 'aws-cdk-lib/aws-apigateway';
import {
  Table,
  AttributeType
} from 'aws-cdk-lib/aws-dynamodb'
import { 
  // FunctionUrlAuthType,
  // FunctionUrl,
  Runtime
} from 'aws-cdk-lib/aws-lambda';
import {
  NodejsFunction
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path'

export class ServerlessRestApiStack extends cdk.Stack {

  public readonly API_NAME: string = "RecipeHttpApi";

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const recipesTable = new Table(this, 'RecipesTable', {
      tableName: 'recipes',
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING
      }
      // sortKey: {
      //   name: 'name',
      //   type: AttributeType.STRING
      // }
    });

    //define lambda resources
    const createRecipeLambda: NodejsFunction = this.addCreateRecipeLambda(recipesTable);
    const getRecipeLambda: NodejsFunction = this.addGetRecipeLambda(recipesTable);
    const updateRecipeLambda: NodejsFunction = this.addUpdateRecipeLambda(recipesTable);
    const deleteRecipeLambda: NodejsFunction = this.addDeleteRecipeLambda(recipesTable);
    //grant dynamo permissions to lambda functions
    recipesTable.grantReadData(getRecipeLambda);
    recipesTable.grantWriteData(createRecipeLambda);
    recipesTable.grantWriteData(deleteRecipeLambda);
    recipesTable.grantReadWriteData(updateRecipeLambda);
    // const createRecipeLambdaFnUrl: FunctionUrl = createRecipeLambda.addFunctionUrl({
    //   authType: FunctionUrlAuthType.NONE
    // });
    // const getRecipeLambdaFnUrl: FunctionUrl = getRecipeLambda.addFunctionUrl({
    //   authType: FunctionUrlAuthType.NONE
    // });

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
    
    recipeResource
    .addMethod('POST', new LambdaIntegration(createRecipeLambda), {
      apiKeyRequired: true
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
      apiKeyRequired: true
    });

    recipeIdResource
    .addMethod('DELETE', new LambdaIntegration(deleteRecipeLambda), {
      requestParameters: {
        "method.request.path.id": true
      },
      apiKeyRequired: true
    })
  }

  addGetRecipeLambda(recipesTable: Table): NodejsFunction {
    const getRecipeLambda = new NodejsFunction(this, 'get-recipe', {
      environment: {
        TABLE_NAME: recipesTable.tableName
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
        TABLE_NAME: recipesTable.tableName,
        TABLE_ARN: recipesTable.tableArn
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
        TABLE_NAME: recipesTable.tableName
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
        TABLE_NAME: recipesTable.tableName
      },
      memorySize: 128,
      timeout: cdk.Duration.seconds(15),
      description: 'Lambda function to update recipe in DynamoDB',
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      entry: path.join(__dirname, '/../src/update-recipe/index.ts')
    })
  }
}
