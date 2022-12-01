import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import { marshall } from "@aws-sdk/util-dynamodb";
import {
    DeleteItemCommand,
    DeleteItemCommandInput
} from "@aws-sdk/client-dynamodb";
import { ddbClient } from '../../utils/DynamoDBClient';

export async function handler(event: APIGatewayEvent, context: Context) {
    let httpStatus = 200;
    try {
        if (event.httpMethod.toUpperCase() !== 'DELETE') {
            httpStatus = 405;
            throw new Error(`${event.httpMethod} HTTP method is not supported in ${context.functionName}`);
        }
        if (event.pathParameters === null || event.pathParameters["recipeId"] === undefined || event.pathParameters["recipeId"] === undefined) {
            httpStatus = 400;
            throw new Error('Parameters are missing from the request.');
        }
        const recipeTableName = process.env.RECIPES_TABLE_NAME;
        const recipeId: string = event.pathParameters["recipeId"]!;
        const ingredientId: string = event.pathParameters["ingredientId"]!;
        const userId = event.requestContext.authorizer!.claims["cognito:username"];
        const deleteCmdInput: DeleteItemCommandInput = {
            TableName: recipeTableName,
            Key: marshall({
                recipeId: recipeId,
                itemId: ingredientId
            }),
            ConditionExpression: "recipeId=:recipeId AND itemId=:itemId AND userId=:userId",
            ExpressionAttributeValues: {
                ":recipeId": {
                    S: recipeId
                },
                ":userId": {
                    S: userId
                },
                ":itemId": {
                    S: ingredientId
                }
            }
        };
        const deleteCmd = new DeleteItemCommand(deleteCmdInput);
        await ddbClient.send(deleteCmd);
        ddbClient.destroy();
        return {
            statusCode: httpStatus,
            body: JSON.stringify({
                message: `Deleted ingredient ${ingredientId} for recipe ${recipeId}.`
            })
        }
    } catch (error) {
        return {
            statusCode: httpStatus < 400 ? 400 : httpStatus,
            body: JSON.stringify({
                error: (error as Error).message
            })
        }
    }
}