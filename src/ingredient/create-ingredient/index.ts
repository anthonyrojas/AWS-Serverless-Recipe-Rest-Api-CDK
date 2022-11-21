import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import { IIngredient, Ingredient } from '../../models/ingredient.model';
import { marshall } from '@aws-sdk/util-dynamodb';
import {
    DynamoDBClient,
    PutItemCommand
} from '@aws-sdk/client-dynamodb';

export async function handler(event: APIGatewayEvent, context: Context) {
    let httpStatus = 200;
    try {
        if (event.httpMethod.toUpperCase() !== 'POST') {
            httpStatus = 405;
            throw new Error(`${event.httpMethod} HTTP method is not supported in ${context.functionName}`);
        }
        if (event.pathParameters === null || event.pathParameters["recipeId"] === undefined && event.pathParameters["recipeId"] === null) {
            httpStatus = 400;
            throw new Error('Recipe ID is missing from request.');
        }
        const recipeTableName = process.env.RECIPES_TABLE_NAME;
        const ddbClient = new DynamoDBClient({
            region: 'us-west-2'
        });
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
            ConditionExpression: 'attribute_exists(recipeId) AND attribute_exists(userId)',
            // ConditionExpression: 'attribute_exists(:recipeId) and attribute_exists(:userId)',
            // ExpressionAttributeValues: {
            //     ":recipeId": {
            //         S: recipeId
            //     },
            //     ":itemId": {
            //         S: userId
            //     }
            // }
        });
        await ddbClient.send(putItemCmd);
        return {
            statusCode: 200,
            body: JSON.stringify({
                ingredient: ingredient.toPutRequestItem()
            })
        }
    } catch (error) {
        return {
            statusCode: httpStatus,
            body: JSON.stringify({
                message: (error as Error).message
            })
        }
    }
}