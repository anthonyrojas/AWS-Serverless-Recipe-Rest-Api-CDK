import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import {
    DynamoDBClient,
    DeleteItemCommand
} from '@aws-sdk/client-dynamodb';

export async function handler(event: APIGatewayEvent, context: Context) {
    let httpStatus = 200;
    try{
        if(event.httpMethod !== 'DELETE') {
            httpStatus = 405;
            throw new Error(`${event.httpMethod} HTTP method is not supported in ${context.functionName}`);
        }
        const recipeTableName = process.env.TABLE_NAME;
        const ddbClient = new DynamoDBClient({
            region: 'us-west-2'
        });
        if(event.pathParameters === null || event.pathParameters["id"] === undefined || event.pathParameters["id"] === null) {
            httpStatus = 400;
            throw new Error("Failed to specify a recipe id. Unable to delete any recipe.");
        }
        const id: string = event.pathParameters["id"] || "";
        if(id === "") {
            httpStatus = 404;
            throw new Error("Failed to specify a recipe id. Unable to delete any recipe.");
        }
        const deleteItemCmd = new DeleteItemCommand({
            TableName: recipeTableName,
            Key: {
                id: {
                    S: id
                }
            }
        });
        await ddbClient.send(deleteItemCmd);
        return {
            statusCode: httpStatus, 
            body: JSON.stringify({
                message: `Successfully deleted recipe with id ${id}`
            })
        }
    } catch (e: any) {
        return {
            statusCode: httpStatus < 400 ? 400 : httpStatus,
            body: JSON.stringify({
                error: e.message
            })
        }
    }
}