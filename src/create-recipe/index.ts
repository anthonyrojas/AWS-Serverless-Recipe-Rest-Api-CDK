import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import {
    DynamoDBClient,
    PutItemCommand
} from '@aws-sdk/client-dynamodb';
import {
    v4 as uuid
} from 'uuid';
import {
    marshall
} from '@aws-sdk/util-dynamodb'

interface RecipeRequestBody {
    name: string;
    steps: Array<string>;
    ingredients: Array<string>;
}

export async function handler (event: APIGatewayEvent, context: Context) {
    try{
        if(event.httpMethod !== 'POST') {
            throw new Error(`${event.httpMethod} HTTP method is not supported in ${context.functionName}`)
        }
        const recipeTableName = process.env.TABLE_NAME;
        const ddbClient = new DynamoDBClient({
            region: 'us-west-2'
        });
        if(event.body === null) {
            throw new Error("Missing request body.")
        }
        const requestBody: RecipeRequestBody = JSON.parse(event.body);
        const recipeId = uuid();
        const createRecipeCmd = new PutItemCommand({
            TableName: recipeTableName,
            Item: marshall({
                id: recipeId,
                ...requestBody
            })
        });
        await ddbClient.send(createRecipeCmd);
        return {
            statusCode: 201,
            body: JSON.stringify({
                id: recipeId,
                name: requestBody.name
            })
        }
    }catch(e: any){
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: e.message
            })
        }
    }
}