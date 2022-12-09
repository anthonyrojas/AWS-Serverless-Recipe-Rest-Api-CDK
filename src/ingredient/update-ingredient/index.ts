import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import { marshall } from '@aws-sdk/util-dynamodb';
import {
    PutItemCommand,
    PutItemCommandInput
} from '@aws-sdk/client-dynamodb';
import { IIngredient, Ingredient } from '../../models/ingredient.model';
import { ddbClient } from '../../utils/DynamoDBClient';

export async function handler(event: APIGatewayEvent, context: Context) {
    let httpStatus = 200;
    try {
        if (event.httpMethod.toUpperCase() !== 'PUT') {
            httpStatus = 405;
            throw new Error(`${event.httpMethod} HTTP method is not supported in ${context.functionName}`);
        }
        if (!event.pathParameters || event.pathParameters === null || !event.pathParameters["recipeId"] || !event.pathParameters["ingredientId"]) {
            httpStatus = 404;
            throw new Error('Parameters are missing from the request.');
        }
        if (!event.requestContext || !event.requestContext.authorizer || !event.requestContext.authorizer.claims["cognito:username"]) {
            httpStatus = 403;
            throw new Error("Unauthorized!");
        }
        const recipeId: string = event.pathParameters["recipeId"]!;
        const ingredientId: string = event.pathParameters["ingredientId"]!;
        const userId = event.requestContext.authorizer!.claims["cognito:username"];
        const recipeTableName = process.env.RECIPES_TABLE_NAME;

        const requestBody: IIngredient = JSON.parse(event.body!);
        const ingredient: Ingredient = new Ingredient(
            recipeId,
            requestBody.name,
            userId,
            requestBody.quantity,
            requestBody.units,
            ingredientId
        );
        const putItemCmdInput: PutItemCommandInput = {
            TableName: recipeTableName,
            Item: marshall({
                ...ingredient.toPutRequestItem()
            }),
            ConditionExpression: 'recipeId=:recipeId AND userId=:userId AND attribute_exists(:itemId)',
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
        const putItemCmd = new PutItemCommand(putItemCmdInput);
        await ddbClient.send(putItemCmd);
        ddbClient.destroy();
        return {
            statusCode: 200,
            body: JSON.stringify({
                ingredient: ingredient.toPutRequestItem()
            })
        };
    } catch (error) {
        const e = error as Error;
        console.error(e.message);
        return {
            statusCode: httpStatus < 400 ? 400 : httpStatus,
            body: JSON.stringify({
                message: e.message
            })
        }
    }
}