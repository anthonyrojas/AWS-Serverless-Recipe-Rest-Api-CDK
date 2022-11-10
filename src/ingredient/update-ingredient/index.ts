import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import { marshall } from '@aws-sdk/util-dynamodb';
import {
    DynamoDBClient,
    PutItemCommand,
    PutItemCommandInput,
    GetItemCommand,
    GetItemCommandInput
} from '@aws-sdk/client-dynamodb';
import { IIngredient, Ingredient } from '../../models/ingredient.model';

export async function handler(event: APIGatewayEvent, context: Context) {
    let httpStatus = 200;
    try {
        if (event.httpMethod.toUpperCase() !== 'PUT') {
            httpStatus = 405;
            throw new Error(`${event.httpMethod} HTTP method is not supported in ${context.functionName}`);
        }
        if (event.pathParameters === null || event.pathParameters["recipeId"] === undefined && event.pathParameters["ingredientId"]) {
            httpStatus = 400;
            throw new Error('Parameters are missing from the request.');
        }
        const recipeId: string = event.pathParameters["recipeId"]!;
        const ingredientId: string = event.pathParameters["ingredientId"]!;
        const userId = event.requestContext.authorizer!.claims["cognito:username"];
        const recipeTableName = process.env.RECIPES_TABLE_NAME;

        const requestBody: IIngredient = JSON.parse(event.body!);
        const ddbClient = new DynamoDBClient({
            region: 'us-west-2'
        });
        const getItemCmdInput: GetItemCommandInput = {
            TableName: recipeTableName,
            Key: marshall({
                recipeId: recipeId,
                itemId: ingredientId
            })
        };
        const getItemCmd: GetItemCommand = new GetItemCommand(getItemCmdInput);
        const data = await ddbClient.send(getItemCmd);
        if (data === undefined || data.Item === undefined) {
            httpStatus = 400;
            throw new Error('The current ingredient does not exist or could not be found.');
        }
        const ingredient: Ingredient = new Ingredient(
            recipeId,
            requestBody.name || data.Item["name"].toString(),
            userId,
            requestBody.quantity || Number(data.Item["quantity"]),
            requestBody.units || data.Item["units"].toString(),
            ingredientId
        );
        const putItemCmdInput: PutItemCommandInput = {
            TableName: recipeTableName,
            Item: marshall({
                ...ingredient.toPutRequestItem()
            }),
            ConditionExpression: 'recipeId=:recipeId AND userId=:userId AND itemId=:itemId',
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
        return {
            statusCode: 200,
            body: JSON.stringify({
                ingredient: ingredient.toPutRequestItem()
            })
        };
    } catch (error: any) {
        return {
            statusCode: httpStatus,
            body: JSON.stringify({
                message: error.message
            })
        }
    }
}