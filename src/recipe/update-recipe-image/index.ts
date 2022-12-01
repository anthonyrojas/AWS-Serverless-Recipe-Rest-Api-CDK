import {
    Context,
    S3Event
} from 'aws-lambda';
import {
    BatchExecuteStatementCommand,
    BatchStatementRequest
} from '@aws-sdk/client-dynamodb';
import { ddbClient } from '../../utils/DynamoDBClient';

export async function handler(event: S3Event, context: Context) {
    try {
        const recipeImageBucketUrl: string = process.env.RECIPE_IMAGE_BUCKET_DOMAIN_NAME!;
        const records = event.Records;
        if(records.length == 0) throw new Error("Record set was empty");
        const recipeImageMap: Record<string, string[]> = {};
        // group by recipeId
        records.forEach(record => {
            // if (record.eventName.toLowerCase().includes("put")) { //only perform action on PUT event
            const keyArray = record.s3.object.key.split('/');
            if (keyArray.length === 2) {
                const recipeId = keyArray[0];
                const filename = keyArray[1];
                if (!recipeImageMap[recipeId]){
                    recipeImageMap[recipeId] = [];
                }
                recipeImageMap[recipeId].push(`${recipeImageBucketUrl}/${filename}`);
            }
            // }
        });
        // batch insert the images to the database
        const recipeIds = Object.keys(recipeImageMap);
        if (recipeIds.length === 0) {
            throw new Error("S3 records did not have a valid key that follows the structure <recipeId>/<filename>");
        }
        const recipeTableName: string = process.env.RECIPES_TABLE_NAME!;
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
        ddbClient.destroy();
        return true;
    } catch (e) {
        const error = e as Error;
        console.error(error.message);
        return false;
    }
}