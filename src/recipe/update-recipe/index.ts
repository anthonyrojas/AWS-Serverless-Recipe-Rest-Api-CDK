import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import {
    DynamoDBClient,
    PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
    marshall
} from '@aws-sdk/util-dynamodb';
import { IRecipe } from "../../models/recipe.model";

export async function handler(event: APIGatewayEvent, context: Context) {
    let httpStatus = 200;
    try{
        if(event.httpMethod !== 'PUT') {
            httpStatus = 405;
            throw new Error(`${event.httpMethod} HTTP method is not supported in ${context.functionName}`);
        }
        const recipeTableName = process.env.RECIPES_TABLE_NAME;
        const ddbClient = new DynamoDBClient({
            region: 'us-west-2'
        });
        if(event.pathParameters === null || event.pathParameters["recipeId"] === undefined || event.pathParameters["recipeId"] === null || event.pathParameters["recipeId"] === "") {
            httpStatus = 400;
            throw new Error("Failed to specify a recipe id. Unable to update any recipe.");
        }
        if(event.body === null) {
            httpStatus = 400;
            throw new Error('Missing fields to update.');
        }
        const id: string = event.pathParameters["recipeId"];
        const requestBody: IRecipe = JSON.parse(event.body);
        const putItemCmd = new PutItemCommand({
            TableName: recipeTableName,
            Item: marshall({
                ...requestBody,
                id: id
            }),
            ConditionExpression: "recipeId = :id and itemId = :itemId and etityType = :entityType",
            ExpressionAttributeValues: {
                ":id": {
                    S: id
                },
                ":itemId": {
                    S: id
                },
                ":entityType": {
                    S: "RECIPE"
                }
            }
        });
        await ddbClient.send(putItemCmd);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Successfully updated ${requestBody.name} recipe.`
            })
        }
    } catch(e: any) {
        return {
            statusCode: httpStatus < 400 ? 400 : httpStatus,
            body: JSON.stringify({
                error: e.message
            })
        }
    }
}