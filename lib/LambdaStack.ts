import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

interface LambdaStackProps extends cdk.StackProps {
    readonly RecipeTable: Table;
    readonly RecipeImageBucket: Bucket;
}

export class LambdaStack extends cdk.Stack {
    public readonly createRecipeLambda: NodejsFunction;
    public readonly updateRecipeLambda: NodejsFunction;
    public readonly getRecipeLambda: NodejsFunction;
    public readonly deleteRecipeLambda: NodejsFunction;
    public readonly createIngredientLambda: NodejsFunction;
    public readonly updateIngredientLambda: NodejsFunction;
    public readonly deleteIngredientLambda: NodejsFunction;
    public readonly createInstructionLambda: NodejsFunction;
    public readonly updateInstructionLambda: NodejsFunction;
    public readonly deleteInstructionLambda: NodejsFunction;
    public readonly getRecipeImagePresignedUrlLambda: NodejsFunction;
    public readonly updateRecipeImageLambda: NodejsFunction;
    private readonly LAMBDA_RUNTIME = Runtime.NODEJS_16_X;

    constructor(scope: Construct, id: string, props: LambdaStackProps) {
        super(scope, id, props);

        /* Recipe Lambdas */
        const recipeFunctions = this.addRecipeLambdas(props.RecipeTable);
        this.createRecipeLambda = recipeFunctions["create-recipe"];
        this.updateRecipeLambda = recipeFunctions["update-recipe"];
        this.deleteRecipeLambda = recipeFunctions["delete-recipe"];
        this.getRecipeLambda = recipeFunctions["get-recipe"];

        /* Recipe Image Lambdas */
        this.getRecipeImagePresignedUrlLambda = recipeFunctions["get-recipe-image-presigned-url"]
        this.updateRecipeImageLambda = recipeFunctions["update-recipe-image"];

        /* Ingredient Lambdas */
        const ingredientFunctions = this.addIngredientLambdas(props.RecipeTable);
        this.createIngredientLambda = ingredientFunctions["create-ingredient"];
        this.updateIngredientLambda = ingredientFunctions["update-ingredient"];
        this.deleteIngredientLambda = ingredientFunctions["delete-ingredient"];

        /* Instruction Lambdas */
        const instructionFunctions = this.addInstructionLambdas(props.RecipeTable);
        this.createInstructionLambda = instructionFunctions["create-instruction"];
        this.updateInstructionLambda = instructionFunctions["update-instruction"];
        this.deleteInstructionLambda = instructionFunctions["delete-instruction"];
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
            entry: path.join(__dirname, `/../src/recipe/${functionSpec.name}/index.ts`),
            logRetention: RetentionDays.ONE_WEEK
          });
          functions[functionSpec.name] = lambda;
          recipeTable.grantReadWriteData(lambda);
        });
        return functions;
      }
      addRecipeImageLambndas(recipeImageBucket: Bucket, recipeTable: Table): Record<string, NodejsFunction> {
        const functions: Record<string, NodejsFunction> = {};
        const getRecipeImageUrl = new NodejsFunction(this, 'get-recipe-image-presigned-url', {
          environment: {
            RECIPE_BUCKET: recipeImageBucket.bucketName
          },
          memorySize: 128,
          timeout: cdk.Duration.seconds(10),
          description: "Lambda function to get a presigned URL to upload an image for a recipe",
          runtime: this.LAMBDA_RUNTIME,
          handler: 'handler',
          entry: path.join(__dirname, `/../src/recipe/get-recipe-image-presigned-url/index.ts`),
          logRetention: RetentionDays.ONE_WEEK
        });
        recipeImageBucket.grantReadWrite(getRecipeImageUrl);
        const updateRecipeImage = new NodejsFunction(this, 'update-recipe-image', {
          environment: {
            RECIPES_TABLE_NAME: recipeTable.tableName
          },
          memorySize: 128,
          timeout: cdk.Duration.seconds(10),
          description: "Lambda function triggered on S3 upload for a new recipe image",
          runtime: this.LAMBDA_RUNTIME,
          handler: 'handler',
          entry: path.join(__dirname, `/../src/recipe/update-recipe-image/index.ts`),
        });
        recipeTable.grantReadWriteData(updateRecipeImage);
        updateRecipeImage.addEventSource(new S3EventSource(recipeImageBucket, {
          events: [EventType.OBJECT_CREATED]
        }));
        functions["get-recipe-image-presigned-url"] = getRecipeImageUrl;
        functions["update-recipe-image"] = updateRecipeImage;
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
            entry: path.join(__dirname, `/../src/ingredient/${functionSpec.name}/index.ts`),
            logRetention: RetentionDays.ONE_WEEK
          });
          functions[functionSpec.name] = lambda;
          recipesTable.grantReadWriteData(lambda);
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
            entry: path.join(__dirname, `/../src/instruction/${functionSpec.name}/index.ts`),
            logRetention: RetentionDays.ONE_WEEK
          });
          functions[functionSpec.name] = lambda;
          recipesTable.grantReadWriteData(lambda);
        });
        return functions;
      }
}