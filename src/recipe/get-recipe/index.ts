import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import {
    DynamoDBClient,
    ScanCommand,
    QueryCommand,
    QueryCommandInput,
    QueryCommandOutput
} from '@aws-sdk/client-dynamodb';
import {
    unmarshall
} from '@aws-sdk/util-dynamodb';
import {IRecipe} from "../../models/recipe.model";
import {IIngredient} from "../../models/ingredient.model";
import {IInstruction} from "../../models/instruction.model";

function unmarshallQueryCmdOutput(outputItems: QueryCommandOutput) {
    if (outputItems.Count === undefined || outputItems.Count === 0 || outputItems.Items === undefined) return [];
    console.log("There are not recipes present in the response from DynamoDB")
    return outputItems.Items.map(item => unmarshall(item));
}

function transformQueryCmdOutputToRecipe(recipeItems: any[]): IRecipe {
    const instructions: IInstruction[] = [];
    const ingredients: IIngredient[] = [];
    let recipe: IRecipe|null = null;
    recipeItems.forEach(recipeItem => {
        if (recipeItem.entityType === "RECIPE") {
            recipe = {
                ...recipeItem,
                instructions: [],
                ingredients: []
            }
        } else if (recipeItem.entityType === "INSTRUCTION") {
            instructions.push(recipeItem);
        } else if (recipeItem.entityType === "INGREDIENT") {
            ingredients.push(recipeItem);
        }
    });
    recipe!.instructions = instructions;
    recipe!.ingredients = ingredients;
    return recipe!;
}

export async function handler (event: APIGatewayEvent, context: Context) {
    let statusCode = 200;
    try {
        if(event.httpMethod !== 'GET') {
            statusCode = 405;
            throw new Error(`${event.httpMethod} HTTP method is not supported in ${context.functionName}`);
        }
        const recipeTableName = process.env.RECIPES_TABLE_NAME!;
        const ddbClient = new DynamoDBClient({
            region: 'us-west-2'
        });
        if(event.pathParameters !== null && event.pathParameters["recipeId"] !== undefined && event.pathParameters["recipeId"] !== null) {
            //get one recipe by recipeId
            const id: string = event.pathParameters["recipeId"];
            const recipeQueryCmdInput: QueryCommandInput = {
                TableName: recipeTableName,
                ExpressionAttributeValues: {
                    ":id": {
                        S: id
                    }
                },
                KeyConditionExpression: 'recipeId = :id'
            }
            const recipeQueryCmd = new QueryCommand(recipeQueryCmdInput);

            const recipeItems = await ddbClient.send(recipeQueryCmd);

            //unmarshall and form response
            const recipeItemsUnmarshalled = await unmarshallQueryCmdOutput(recipeItems);
            if (recipeItemsUnmarshalled.length === 0) {
                return {
                    statusCode: 404,
                    body: JSON.stringify({
                        recipe: {},
                        message: 'Recipe not found.'
                    })
                }
            }
            const recipe = transformQueryCmdOutputToRecipe(recipeItemsUnmarshalled);

            return {
                statusCode: 200,
                body: JSON.stringify({
                    recipe: recipe
                })
            }
        }
        //get all recipes with names and id only
        let limit = 20;
        const queryParams = event.queryStringParameters;
        if(queryParams !== undefined && queryParams !== null) {
            limit = Number(queryParams["limit"]) || 20;
        }
        const scanCmd = new ScanCommand({
            TableName: recipeTableName,
            //AttributesToGet: ["recipeId", "itemId", "name", "entityType"],
            // Limit: limit,
            FilterExpression: "entityType = :entityType",
            ExpressionAttributeValues: {
                ":entityType": {
                    S: "RECIPE"
                }
            },
        });
        const data = await ddbClient.send(scanCmd);
        const unmarshalledItems = data.Items?.map(item => {
            const recipeItem = unmarshall(item);
            return {
                recipeId: recipeItem.recipeId,
                itemId: recipeItem.itemId,
                userId: recipeItem.userId,
                name: recipeItem.name
            }
        }).splice(0, limit);
        return {
            statusCode: 200,
            body: JSON.stringify({
                recipes: unmarshalledItems,
                count: data.Count,
                lastEvaluatedKey: !data.LastEvaluatedKey ? undefined : unmarshall(data.LastEvaluatedKey)
            })
        }
        //let startKey = null;
        // if (queryParams["recipeId"] || queryParams["userId"])
        // const scanCmd = new ScanCommand({
        //     TableName: recipeTableName,
        //     AttributesToGet: ["id", "userId", "name"],
        //     Limit: limit,
        //     ExclusiveStartKey: {
        //         id: {
        //             S: queryParams["recipeId"]
        //         },
        //         userId: {
        //             S: queryParams["userId"]
        //         }
        //     }
        // })
        // const data = await ddbClient.send(scanCmd);
        // if(data === null || data.Items === undefined){
        //     statusCode = 404;
        //     throw new Error(`Cannot find any recipes. Try creating some!`);
        // }
        // const unmarshalledItems = data.Items.map(item => unmarshall(item));
        // return {
        //     statusCode: 200,
        //     body: JSON.stringify({
        //         recipes: []
        //     })
        // }
    } catch(e: any) {
        console.log(e);
        return {
            statusCode: statusCode < 400 ? 400 : statusCode,
            body: JSON.stringify({
                error: e.message
            })
        }
    }
}