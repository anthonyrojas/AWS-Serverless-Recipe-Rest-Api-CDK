import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import {
    DynamoDBClient,
    BatchWriteItemCommand,
    BatchWriteItemCommandInput
} from '@aws-sdk/client-dynamodb';
import {
    marshall
} from '@aws-sdk/util-dynamodb'
import {Recipe, IRecipe} from "../../models/recipe.model";

export async function handler (event: APIGatewayEvent, context: Context) {
    let statusCode = 200;
    try{
        //const userId = event.requestContext.authorizer;
        console.log(JSON.stringify(event.requestContext));
        if(event.httpMethod !== 'POST') {
            throw new Error(`${event.httpMethod} HTTP method is not supported in ${context.functionName}`)
        }
        if (event.requestContext.authorizer === undefined || event.requestContext.authorizer === null) {
            statusCode = 403;
            throw new Error(`Missing authentication token. Failed to create recipe`);
        }
        const userId = event.requestContext.authorizer.claims["cognito:username"]
        const recipeTableName = process.env.RECIPES_TABLE_NAME!;
        const ddbClient = new DynamoDBClient({
            region: 'us-west-2'
        });
        if(event.body === null) {
            throw new Error("Missing request body.")
        }
        const requestBody: IRecipe = JSON.parse(event.body);
        const {name, description, cookTime, prepTime, ingredients, instructions} = requestBody;
        const recipe: Recipe = new Recipe(userId, name, description, cookTime, prepTime);
        recipe.attachIIngredients(ingredients!);
        recipe.attachIInstructions(instructions!);

        const putIngredients = recipe.ingredients.map(ingredient => {
            return {
                PutRequest: {
                    Item: marshall(ingredient.toPutRequestItem())
                }
            }
        });
        const putInstructions = recipe.instructions.map(instruction => {
            return {
                PutRequest: {
                    Item: marshall(instruction.toPutRequestItem())
                }
            }
        });
        const batchWriteCmdInput: BatchWriteItemCommandInput = {
            RequestItems: {
                [recipeTableName]: [
                    {
                        PutRequest: {
                            Item: marshall(recipe.toPutRequestItem())
                        }
                    },
                    ...putIngredients,
                    ...putInstructions
                ],
            }
        };
        const batchWriteCmd = new BatchWriteItemCommand(batchWriteCmdInput)
        await ddbClient.send(batchWriteCmd);
        return {
            statusCode: 200,
            body: JSON.stringify({
                recipe: recipe
            })
        }
    }catch(e: any){
        console.log(e.message);
        console.log(e);
        return {
            statusCode: statusCode < 400 ? 400 : statusCode,
            body: JSON.stringify({
                error: e.message
            })
        }
    }
}