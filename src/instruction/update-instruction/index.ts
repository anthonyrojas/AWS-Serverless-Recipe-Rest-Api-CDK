import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import {
    DynamoDBClient,
    PutItemCommand,
    PutItemCommandInput
} from '@aws-sdk/client-dynamodb';
import {
    marshall
} from '@aws-sdk/util-dynamodb';
import { IInstruction } from '../../models/instruction.model';

export async function handler(event: APIGatewayEvent, context: Context) {
    let statusCode = 200;
    try {
        if (event.httpMethod !== 'PUT') {
            statusCode = 405;
            throw new Error(`${event.httpMethod} HTTP method is not supported in ${context.functionName}`);
        }
        if (event.pathParameters === null || event.pathParameters["recipeId"] === undefined || event.pathParameters["instructionId"] === undefined) {
            statusCode = 400;
            throw new Error("Missing parameters for a valid request.");
        }
        const recipeId: string = event.pathParameters["recipeId"];
        const userId = event.requestContext.authorizer!.claims["cognito:username"];
        const ingredientId: string = event.pathParameters["ingredientId"]!;
        const recipeTableName: string = process.env.RECIPES_TABLE_NAME!;
        const ddbClient = new DynamoDBClient({
            region: 'us-west-2'
        });
        const eventBody: IInstruction = JSON.parse(event.body!);
        const putItemCmdInput: PutItemCommandInput = {
            TableName: recipeTableName,
            Item: marshall(eventBody),
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
        const putItemCmd = new PutItemCommand(putItemCmdInput);
        await ddbClient.send(putItemCmd);
        return {
            statusCode: 200, 
            body: JSON.stringify(eventBody)
        }
    } catch (error) {
        console.error((error as Error).message);
        return {
            statusCode: statusCode < 400 ? 400 : statusCode,
            body: JSON.stringify({
                message: (error as Error).message
            })
        }
    }
}