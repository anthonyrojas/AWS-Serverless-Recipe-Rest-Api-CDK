#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/DatabaseStack';
import { LambdaStack } from '../lib/LambdaStack';
import { AuthStack } from '../lib/AuthStack';
import { RestApiStack } from '../lib/RestApiStack';

const app = new cdk.App();

const SERVERLESS_RECIPE_API_PREFIX = `ServerlessRecipeApi`;
const REGION = "us-west-2"

const databaseStack = new DatabaseStack(app, `${SERVERLESS_RECIPE_API_PREFIX}DatabaseStack`, {
  env: {
    region: REGION
  }
});

const lambdaStack = new LambdaStack(app, `${SERVERLESS_RECIPE_API_PREFIX}LambdaStack`, {
  env: {
    region: REGION
  },
  RecipeTable: databaseStack.RecipesTable
});

const authStack = new AuthStack(app, `${SERVERLESS_RECIPE_API_PREFIX}AuthStack`, {
  env: {
    region: REGION
  }
});


new RestApiStack(app, `${SERVERLESS_RECIPE_API_PREFIX}RestApiStack`, {
  env: {
    region: REGION
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
})

// new ServerlessRestApiStack(app, 'ServerlessRestApiStack', {
//   env: {
//     region: "us-west-2"
//   }
//   /* If you don't specify 'env', this stack will be environment-agnostic.
//    * Account/Region-dependent features and context lookups will not work,
//    * but a single synthesized template can be deployed anywhere. */

//   /* Uncomment the next line to specialize this stack for the AWS Account
//    * and Region that are implied by the current CLI configuration. */
//   // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

//   /* Uncomment the next line if you know exactly what Account and Region you
//    * want to deploy the stack to. */
//   // env: { account: '123456789012', region: 'us-east-1' },

//   /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
// });