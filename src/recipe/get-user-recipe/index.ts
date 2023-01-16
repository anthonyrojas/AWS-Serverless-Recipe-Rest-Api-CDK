import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import {
    QueryCommand,
    QueryCommandInput,
    QueryCommandOutput
} from '@aws-sdk/client-dynamodb';
import {
    unmarshall
} from '@aws-sdk/util-dynamodb';
import {IRecipe} from "../../models/recipe.model";
import {ddbClient} from '../../utils/DynamoDBClient';
import { headers } from '../../utils/Headers';

export async function handler (event: APIGatewayEvent, context: Context) {
    let statusCode = 200;
    try {
        if(event.httpMethod !== 'GET') {
            statusCode = 405;
            throw new Error(`${event.httpMethod} HTTP method is not supported in ${context.functionName}`);
        }
        const recipeTableName = process.env.RECIPES_TABLE_NAME!;
        const userId: string = event.pathParameters!["userId"]!;
        let limit = 100;
        const queryParams = event.queryStringParameters;
        if(queryParams !== undefined && queryParams !== null && queryParams["limit"]) {
            limit = Number(queryParams["limit"]) || 20;
        }
        const queryCmdInput: QueryCommandInput = {
            TableName: recipeTableName,
            ExpressionAttributeValues: {
                ":userId": {
                    S: userId
                },
                ":entityType": {
                    S: "RECIPE"
                }
            },
            KeyConditionExpression: 'userId=:userId',
            FilterExpression: "entityType=:entityType",
            IndexName: "UserItemIndex",
            ProjectionExpression: "recipeId,itemId,userId,entityType,imageUrls,searchName,title",
            Limit: limit
        };
        const queryCmd = new QueryCommand(queryCmdInput);
        const res = await ddbClient.send(queryCmd);
        const recipes = res.Items?.map(item => {
            return unmarshall(item) as IRecipe;
        });
        ddbClient.destroy();
        return {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify({
                recipes: recipes,
                count: res.Count,
                lastEvaluatedKey: res.LastEvaluatedKey
            })
        }
    } catch (e: any) {
        const error = e as Error;
        console.log(e);
        return {
            statusCode: statusCode < 400 ? 400 : statusCode,
            headers: headers,
            body: JSON.stringify({
                error: e.message
            })
        }
    }
}