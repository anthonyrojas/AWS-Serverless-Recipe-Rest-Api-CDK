import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import { S3Client, PutObjectCommand} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {v4 as uuid} from "uuid";

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
        const url = new URL(signedUrl);
        if (url.protocol !== "https") {
            statusCode = 400;
            throw new Error("Failed to create a valid pre-signed URL");
        }
        return {
            statusCode: 200,
            body: JSON.stringify({
                signedUrl,
                filename: `${key}.${imageExt}`
            })
        };
    } catch (error) {
        console.error((error as Error).message);
        return {
            statusCode: statusCode < 400 ? 400 : statusCode,
            body: JSON.stringify({
                message: (error as Error).message
            })
        }
    }
}
