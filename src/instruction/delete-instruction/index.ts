import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import {
    DeleteItemCommand,
    DeleteItemCommandInput
} from '@aws-sdk/client-dynamodb';
import { ddbClient } from '../../utils/DynamoDBClient';

export async function handler(event: APIGatewayEvent, context: Context) {
    let statusCode = 200;
    try {
        if (event.httpMethod !== 'DELETE') {
            statusCode = 405;
            throw new Error(`${event.httpMethod} HTTP method is not supported in ${context.functionName}`);
        }
        const recipeTableName: string = process.env.RECIPES_TABLE_NAME!;
        if (event.pathParameters === null || !event.pathParameters["recipeId"] || !event.pathParameters["instructionId"]) {
            statusCode = 404;
            throw new Error("Missing parameters for a valid request.");
        }
        if(!event.requestContext || event.requestContext === null || !event.requestContext.authorizer || event.requestContext.authorizer === null || !event.requestContext.authorizer.claims["cognito:username"]) {
            statusCode = 403;
            throw new Error("Unauthenticated!");
        }
        const userId = event.requestContext.authorizer.claims["cognito:username"];
        const instructionId = event.pathParameters["instructionId"];
        const recipeId = event.pathParameters["recipeId"];
        const deleteItemCmdInput: DeleteItemCommandInput = {
            TableName: recipeTableName,
            Key: {
                "recipeId": {
                    S: recipeId
                },
                "itemId": {
                    S: instructionId
                }
            },
            ConditionExpression: 'userId=:userId AND entityType=:entityType',
            ExpressionAttributeValues: {
                ":userId": {
                    S: userId
                },
                ":entityType": {
                    S: "INSTRUCTION"
                }
            }
        };
        const deleteItemCmd = new DeleteItemCommand(deleteItemCmdInput);
        await ddbClient.send(deleteItemCmd);
        ddbClient.destroy();
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Deleted instruction ${instructionId} from recipe ${recipeId}`
            })
        };
    } catch (error) {
        const e = error as Error;
        console.error(e.message);
        return {
            statusCode: statusCode < 400 ? 400 : statusCode,
            body: JSON.stringify({
                message: e.message
            })
        }
    }
}