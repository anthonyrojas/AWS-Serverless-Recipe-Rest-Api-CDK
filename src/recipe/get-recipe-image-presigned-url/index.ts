import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import { S3Client, PutObjectCommand} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {v4 as uuid} from "uuid";
import { headers } from '../../utils/Headers';

export async function handler(event: APIGatewayEvent, context: Context) {
    let statusCode = 200;
    try {
        if (event.httpMethod !== 'GET') {
            statusCode = 405;
            throw new Error(`${event.httpMethod} HTTP method is not supported in ${context.functionName}`);
        }
        const client = new S3Client({
            region: 'us-west-2'
        });
        const imageExt: string = event.queryStringParameters!["imageExt"]!;
        const key = uuid().replace("-", "");
        const command = new PutObjectCommand({
            Bucket: process.env.RECIPE_BUCKET!,
            Key: `${event.pathParameters!["recipeId"]}/${key}.${imageExt}`,
            ACL: "public-read"
            
        })
        const signedUrl = await getSignedUrl(
            client, 
            command, 
            {
                expiresIn: 120 //2 minutes
            }
        );
        return {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify({
                signedUrl,
                filename: `${key}.${imageExt}`
            })
        };
    } catch (e) {
        const error = e as Error;
        console.error(error.message);
        return {
            statusCode: statusCode < 400 ? 400 : statusCode,
            headers: headers,
            body: JSON.stringify({
                message: error.message
            })
        }
    }
}
