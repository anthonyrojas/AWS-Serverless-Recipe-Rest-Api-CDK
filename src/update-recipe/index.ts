import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import {
    DynamoDBClient,
    PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
    marshall
} from '@aws-sdk/util-dynamodb';

interface RecipeRequestBody {
    name: string;
    steps: Array<string>;
    ingredients: Array<string>;
}

export async function handler(event: APIGatewayEvent, context: Context) {
    let httpStatus = 200;
    try{
        if(event.httpMethod !== 'PUT') {
            httpStatus = 405;
            throw new Error(`${event.httpMethod} HTTP method is not supported in ${context.functionName}`);
        }
        const recipeTableName = process.env.TABLE_NAME;
        const ddbClient = new DynamoDBClient({
            region: 'us-west-2'
        });
        if(event.pathParameters === null || event.pathParameters["id"] === undefined || event.pathParameters["id"] === null || event.pathParameters["id"] === "") {
            httpStatus = 400;
            throw new Error("Failed to specify a recipe id. Unable to update any recipe.");
        }
        if(event.body === null) {
            httpStatus = 400;
            throw new Error('Missing fields to update.');
        }
        const id: string = event.pathParameters["id"];
        const requestBody: RecipeRequestBody = JSON.parse(event.body);
        const putItemCmd = new PutItemCommand({
            TableName: recipeTableName,
            Item: marshall({
                id: id,
                ...requestBody
            }),
            ConditionExpression: "id = :id",
            ExpressionAttributeValues: {
                ":id": {
                    S: id
                }
            }
        });
        await ddbClient.send(putItemCmd);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Successfully updated ${requestBody.name} recipe.`
            })
        }
    } catch(e: any) {
        return {
            statusCode: httpStatus < 400 ? 400 : httpStatus,
            body: JSON.stringify({
                error: e.message
            })
        }
    }
}