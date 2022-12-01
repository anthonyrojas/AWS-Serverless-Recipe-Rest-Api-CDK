import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import {
    PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
    marshall
} from '@aws-sdk/util-dynamodb';
import { IRecipe } from "../../models/recipe.model";
import { ddbClient } from '../../utils/DynamoDBClient';

export async function handler(event: APIGatewayEvent, context: Context) {
    let httpStatus = 200;
    try{
        if(event.httpMethod !== 'PUT') {
            httpStatus = 405;
            throw new Error(`${event.httpMethod} HTTP method is not supported in ${context.functionName}`);
        }
        const recipeTableName = process.env.RECIPES_TABLE_NAME;
        if (!event.requestContext || !event.requestContext.authorizer || !event.requestContext.authorizer.claims["cognito:username"]) {
            httpStatus = 403;
            throw new Error(`Missing authentication token. Failed to create recipe`);
        }
        const userId = event.requestContext.authorizer.claims["cognito:username"];
        if(event.pathParameters === null || !event.pathParameters["recipeId"]|| event.pathParameters["recipeId"] === null || event.pathParameters["recipeId"] === "") {
            httpStatus = 400;
            throw new Error("Failed to specify a recipe id. Unable to update any recipe.");
        }
        const id: string = event.pathParameters["recipeId"];
        const requestBody: IRecipe = JSON.parse(event.body!);
        const putItemCmd = new PutItemCommand({
            TableName: recipeTableName,
            Item: marshall({
                ...requestBody,
                id: id
            }),
            ConditionExpression: "recipeId = :id and itemId = :itemId and etityType = :entityType AND userId=:userId",
            ExpressionAttributeValues: {
                ":id": {
                    S: id
                },
                ":itemId": {
                    S: id
                },
                ":entityType": {
                    S: "RECIPE"
                },
                ":userId": {
                    S: userId
                }
            }
        });
        await ddbClient.send(putItemCmd);
        ddbClient.destroy();
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Successfully updated ${requestBody.name} recipe.`
            })
        }
    } catch(error) {
        const e = error as Error;
        return {
            statusCode: httpStatus < 400 ? 400 : httpStatus,
            body: JSON.stringify({
                error: e.message
            })
        }
    }
}