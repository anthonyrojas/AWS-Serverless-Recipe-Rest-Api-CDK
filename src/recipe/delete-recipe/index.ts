import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import {
    DynamoDBClient,
    QueryCommand,
    BatchWriteItemCommand,
    BatchWriteItemCommandInput
} from '@aws-sdk/client-dynamodb';

export async function handler(event: APIGatewayEvent, context: Context) {
    let httpStatus = 200;
    try{
        if(event.httpMethod !== 'DELETE') {
            httpStatus = 405;
            throw new Error(`${event.httpMethod} HTTP method is not supported in ${context.functionName}`);
        }
        const recipeTableName: string = process.env.RECIPES_TABLE_NAME!;
        const userId = event.requestContext.authorizer!.claims["cognito:username"];
        const ddbClient = new DynamoDBClient({
            region: 'us-west-2'
        });
        if(event.pathParameters === null || event.pathParameters["recipeId"] === undefined || event.pathParameters["recipeId"] === null) {
            httpStatus = 400;
            throw new Error("Failed to specify a recipe id. Unable to delete any recipe.");
        }
        const id: string = event.pathParameters["recipeId"]!;
        if(id === "") {
            httpStatus = 404;
            throw new Error("Failed to specify a recipe id. Unable to delete any recipe.");
        }
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
        return {
            statusCode: httpStatus, 
            body: JSON.stringify({
                message: `Successfully deleted recipe with id ${id}`
            })
        }
    } catch (error) {
        const e = error as Error;
        return {
            statusCode: httpStatus < 400 ? 400 : httpStatus,
            body: JSON.stringify({
                error: e.message
            })
        }
    }
}