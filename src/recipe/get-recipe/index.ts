import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import {
    AttributeValue,
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
import {ddbClient} from '../../utils/DynamoDBClient';

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
        if(event.pathParameters !== undefined && event.pathParameters !== null && event.pathParameters["recipeId"] !== undefined && event.pathParameters["recipeId"] !== undefined) {
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
            ddbClient.destroy();
            return {
                statusCode: 200,
                body: JSON.stringify({
                    recipe: recipe
                })
            }
        }
        //get all recipes without the description
        let limit = 100;
        const queryParams = event.queryStringParameters;
        if(queryParams !== undefined && queryParams !== null && queryParams["limit"]) {
            limit = Number(queryParams["limit"]) || 20;
        }
        let paginationStart: Record<string, AttributeValue> | undefined = undefined;
        if (queryParams && queryParams["paginationKey"] && queryParams["paginationKey"] !== null) {
            paginationStart = {};
            paginationStart["entityType"] = {S: 'RECIPE'};
            paginationStart["recipeId"] = {S: queryParams["paginationKey"]}
            paginationStart["itemId"] = {S: queryParams["paginationKey"]};
        }
        let searchName: string = "";
        if (queryParams && queryParams["searchName"] && queryParams["searchName"] !== null) {
            searchName=queryParams["searchName"].toLowerCase().trim();
        }
        const queryCmd = new QueryCommand({
            TableName: recipeTableName,
            IndexName: "EntityTypeItemIndex",
            KeyConditionExpression: "entityType=:entityType",
            ExpressionAttributeValues: {
                ":entityType": {
                    S: "RECIPE"
                },
                ":searchName": {
                    S: searchName
                }
            },
            Limit: limit,
            FilterExpression: "contains(searchName, :searchName)",
            ProjectionExpression: "recipeId,itemId,userId,entityType,imageUrls,searchName",
            ExclusiveStartKey: paginationStart
        });
        const data = await ddbClient.send(queryCmd);
        if (!data.Items || !data.Count) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    recipes: [],
                    count: 0,
                    lastEvaluatedKey: null
                })
            }
        }
        const recipes = data.Items.map(item => {
            return unmarshall(item) as IRecipe;
        });
        ddbClient.destroy();
        return {
            statusCode: 200,
            body: JSON.stringify({
                recipes: recipes,
                count: data.Count,
                lastEvaluatedKey: !data.LastEvaluatedKey ? undefined : unmarshall(data.LastEvaluatedKey)
            })
        }
    } catch(error) {
        const e = error as Error;
        console.log(e);
        return {
            statusCode: statusCode < 400 ? 400 : statusCode,
            body: JSON.stringify({
                error: e.message
            })
        }
    }
}