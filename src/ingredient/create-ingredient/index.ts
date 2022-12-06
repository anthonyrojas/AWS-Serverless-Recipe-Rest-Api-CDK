import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import { IIngredient, Ingredient } from '../../models/ingredient.model';
import { marshall } from '@aws-sdk/util-dynamodb';
import {
    PutItemCommand
} from '@aws-sdk/client-dynamodb';
import { ddbClient } from '../../utils/DynamoDBClient';

export async function handler(event: APIGatewayEvent, context: Context) {
    let httpStatus = 200;
    try {
        if (event.httpMethod.toUpperCase() !== 'POST') {
            httpStatus = 405;
            throw new Error(`${event.httpMethod} HTTP method is not supported in ${context.functionName}`);
        }
        if (!event.pathParameters || event.pathParameters === null || !event.pathParameters["recipeId"] || event.pathParameters["recipeId"] === null) {
            httpStatus = 404;
            throw new Error('Recipe ID is missing from request.');
        }
        if (!event.requestContext.authorizer || event.requestContext.authorizer === null || !event.requestContext.authorizer.claims["cognito:username"]) {
            httpStatus = 403;
            throw new Error("Unauthenticated!");
        }
        const recipeTableName = process.env.RECIPES_TABLE_NAME;
        const recipeId: string = event.pathParameters["recipeId"]!;
        const userId = event.requestContext.authorizer!.claims["cognito:username"];

        const requestBody: IIngredient = JSON.parse(event.body!);
        const ingredient: Ingredient = new Ingredient(
            recipeId,
            userId,
            requestBody.name,
            requestBody.quantity,
            requestBody.units
        );
        
        const putItemCmd = new PutItemCommand({
            TableName: recipeTableName,
            Item: marshall({
                ...ingredient.toPutRequestItem()
            }),
            ConditionExpression: 'attribute_exists(recipeId) AND attribute_exists(userId)'
        });
        await ddbClient.send(putItemCmd);
        ddbClient.destroy();
        return {
            statusCode: 200,
            body: JSON.stringify({
                ingredient: ingredient.toPutRequestItem()
            })
        }
    } catch (error) {
        console.error((error as Error).message);
        return {
            statusCode: httpStatus < 400 ? 400 : httpStatus,
            body: JSON.stringify({
                message: (error as Error).message
            })
        }
    }
}