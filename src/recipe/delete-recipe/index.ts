import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import {
    QueryCommand,
    BatchWriteItemCommand,
    BatchWriteItemCommandInput
} from '@aws-sdk/client-dynamodb';
import { ddbClient } from '../../utils/DynamoDBClient';

export async function handler(event: APIGatewayEvent, context: Context) {
    let httpStatus = 200;
    try{
        if(event.httpMethod !== 'DELETE') {
            httpStatus = 405;
            throw new Error(`${event.httpMethod} HTTP method is not supported in ${context.functionName}`);
        }
        const recipeTableName: string = process.env.RECIPES_TABLE_NAME!;
        if (!event.requestContext.authorizer || event.requestContext.authorizer === null || event.requestContext.authorizer.claims === null) {
            httpStatus = 403;
            throw new Error(`Missing authentication token. Failed to create recipe`);
        }
        const userId = event.requestContext.authorizer!.claims["cognito:username"];
        if(event.pathParameters === null || event.pathParameters["recipeId"] === undefined || event.pathParameters["recipeId"] === null) {
            httpStatus = 404;
            throw new Error("Failed to specify a recipe id. Unable to delete any recipe.");
        }
        const id: string = event.pathParameters["recipeId"]!;
        //query recipe and related items
        const queryItemCmd = new QueryCommand({
            TableName: recipeTableName,
            ExpressionAttributeValues: {
                ":id": {
                    S: id
                },
                ":userId": {
                    S: userId
                }
            },
            KeyConditionExpression: "recipeId = :id",
            FilterExpression: "userId=:userId"
        });
        const recipeItems = await ddbClient.send(queryItemCmd);
        if (!recipeItems.Count || !recipeItems.Items || recipeItems.Count! === 0) {
            httpStatus = 404;
            throw new Error(`Failed to find an recipes with recipe id ${id}. Unable to delete any recipe.`);
        }
        const deleteItems = recipeItems.Items!.map(item => {
            return {
                DeleteRequest: {
                    Key: {
                        recipeId: item.recipeId,
                        itemId: item.itemId
                    }
                }
            }
        })
        const batchWriteCmdInput: BatchWriteItemCommandInput = {
            RequestItems: {
                [recipeTableName]: deleteItems
            }
        }
        const batchDeleteCmd = new BatchWriteItemCommand(batchWriteCmdInput);
        await ddbClient.send(batchDeleteCmd);
        ddbClient.destroy();
        return {
            statusCode: httpStatus, 
            body: JSON.stringify({
                message: `Successfully deleted recipe with id ${id}`
            })
        }
    } catch (error) {
        const e = error as Error;
        console.log(httpStatus)
        return {
            statusCode: httpStatus < 400 ? 400 : httpStatus,
            body: JSON.stringify({
                error: e.message
            })
        }
    }
}