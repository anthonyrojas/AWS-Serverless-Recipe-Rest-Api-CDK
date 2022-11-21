import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaStack } from './LambdaStack';
import { AuthStack } from './AuthStack';
import { RestApiStack } from './RestApiStack';
import { DatabaseStack } from './DatabaseStack';

export class ServerlessRecipeApiPipelineStage extends cdk.Stage {
    private readonly SERVERLESS_RECIPE_API_PREFIX = `ServerlessRecipeApi`;
    private readonly REGION = "us-west-2";
    constructor(scope: Construct, id: string, props?: cdk.StageProps) {
        super(scope, id, props);
        const databaseStack = new DatabaseStack(this, `${this.SERVERLESS_RECIPE_API_PREFIX}DatabaseStack`, {
            env: {
              region: this.REGION
            }
          });
          
          const lambdaStack = new LambdaStack(this, `${this.SERVERLESS_RECIPE_API_PREFIX}LambdaStack`, {
            env: {
              region: this.REGION
            },
            RecipeTable: databaseStack.RecipesTable
          });
          
          const authStack = new AuthStack(this, `${this.SERVERLESS_RECIPE_API_PREFIX}AuthStack`, {
            env: {
              region: this.REGION
            }
          });
          
          
          new RestApiStack(this, `${this.SERVERLESS_RECIPE_API_PREFIX}RestApiStack`, {
            env: {
              region: this.REGION
            },
            createRecipeLambda: lambdaStack.createRecipeLambda,
            getRecipeLambda: lambdaStack.getRecipeLambda,
            updateRecipeLambda: lambdaStack.updateRecipeLambda,
            deleteRecipeLambda: lambdaStack.deleteRecipeLambda,
            createIngredientLambda: lambdaStack.createIngredientLambda,
            updateIngredientLambda: lambdaStack.updateIngredientLambda,
            deleteIngredientLambda: lambdaStack.deleteIngredientLambda,
            createInstructionLambda: lambdaStack.createIngredientLambda,
            deleteInstructionLambda: lambdaStack.deleteIngredientLambda,
            updateInstructionLambda: lambdaStack.updateIngredientLambda,
            userPool: authStack.userPool
          });
    }
}