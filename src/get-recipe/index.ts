import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import {
    DynamoDBClient,
    GetItemCommand,
    ScanCommand
} from '@aws-sdk/client-dynamodb';
import {
    unmarshall,
} from '@aws-sdk/util-dynamodb'

export async function handler (event: APIGatewayEvent, context: Context) {
    let statusCode = 200;
    try {
        if(event.httpMethod !== 'GET') {
            statusCode = 405;
            throw new Error(`${event.httpMethod} HTTP method is not supported in ${context.functionName}`);
        }
        const recipeTableName = process.env.TABLE_NAME;
        const ddbClient = new DynamoDBClient({
            region: 'us-west-2'
        });
        if(event.pathParameters !== null && event.pathParameters["id"] !== null) {
            const id: string = event.pathParameters["id"] || "";
            const getItemCmd = new GetItemCommand({
                TableName: recipeTableName,
                Key: {
                    id: {
                        S: id
                    }
                }
            })
            const item = await ddbClient.send(getItemCmd);
            if(item === null || item.Item === undefined) { 
                statusCode = 404;
                throw new Error(`Cannot find a recipe with ID ${id}`);
            }
            return {
                statusCode: 200, 
                body: JSON.stringify({recipe: unmarshall(item.Item)})
            }
        }
        let limit = 20;
        const queryParams = event.queryStringParameters;
        if(queryParams !== undefined && queryParams !== null) {
            limit = Number(queryParams["limit"]) || 20;
        }
        const scanCmd = new ScanCommand({
            TableName: recipeTableName,
            AttributesToGet: ["id", "name"]
        })
        const data = await ddbClient.send(scanCmd);
        if(data === null || data.Items === undefined){
            statusCode = 404;
            throw new Error(`Cannot find any recipes. Try creating some!`);
        }
        const unmarshalledItems = data.Items.map(item => unmarshall(item));
        return {
            statusCode: 200,
            body: JSON.stringify({
                recipes: unmarshalledItems
            })
        }
    } catch(e: any) {
        return {
            statusCode: statusCode < 400 ? 400 : statusCode,
            body: JSON.stringify({
                error: e.message
            })
        }
    }
}