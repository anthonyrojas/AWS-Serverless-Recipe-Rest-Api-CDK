import {
    Context,
    S3Event
} from 'aws-lambda';
import {
    DynamoDBClient,
    BatchExecuteStatementCommand,
    BatchStatementRequest
} from '@aws-sdk/client-dynamodb';

export async function handler(event: S3Event, context: Context) {
    const records = event.Records;
    const recipeImageMap: Record<string, string[]> = {};
    // group by recipeId
    records.forEach(record => {
        const keyArray = record.s3.object.key.split('/');
        const recipeId = keyArray[0];
        const filename = keyArray[1];
        if (recipeImageMap[recipeId] === undefined) {
            recipeImageMap[recipeId] = [];
        }
        recipeImageMap[recipeId].push(filename);
    });
    // batch insert the images to the database
    const recipeIds = Object.keys(recipeImageMap);
    const recipeTableName: string = process.env.RECIPES_TABLE_NAME!;
    const ddbClient = new DynamoDBClient({
        region: 'us-west-2'
    });
    const putItems = recipeIds.map(recipeId => {
        return {
            Statement: "UPDATE " + recipeTableName + " SET imageUrls=? WHERE recipeId=?",
            Parameters: [
                {
                    SS: recipeImageMap[recipeId]
                },
                {
                    S: recipeId
                }
            ]
        } as BatchStatementRequest;
    });
    await ddbClient.send(new BatchExecuteStatementCommand({
        Statements: putItems
    }));
}