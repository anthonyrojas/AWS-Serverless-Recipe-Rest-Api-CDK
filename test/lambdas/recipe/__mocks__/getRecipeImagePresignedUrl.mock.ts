import * as S3Presigner from '@aws-sdk/s3-request-presigner';
import { APIGatewayEvent, Context } from 'aws-lambda';

export const mockResolvedValueSuccess = "https://examplebucket.s3.us-west-2.amazonaws.com/uploads/arandomimage.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AmazonCredential&X-Amz-Date=20221205T035141Z&X-Amz-Expires=300&X-Amz-Security-Token=SomeAmazonSecurityToken&X-Amz-SignedHeaders=host&x-amz-acl=public-read&x-id=PutObject";

export const mockContext: Context = {
    functionName: 'get-recipe-image-presigned-url'
} as any;

const MOCK_USER_ID="0000-0000-0000-00000";
const MOCK_RECIPE_ID="1111-1111-1111-11111";

export const mockInvalidHttpMethodEvent: APIGatewayEvent = {
    httpMethod: 'PUT',
    body: null,
    headers: {},
    path: "/recipe/{recipeId}/imageUrl",
    pathParameters: {
        "recipeId": MOCK_RECIPE_ID
    },
    queryStringParameters: {
        "imageExt": "png"
    },
    isBase64Encoded: false,
    requestContext: {
        authorizer: {
            claims: {
                "cognito:username": MOCK_USER_ID
            }
        }
    }
} as any;
export const mockValidEvent: APIGatewayEvent = {
    httpMethod: 'GET',
    body: null,
    headers: {},
    path: "/recipe/{recipeId}/imageUrl",
    pathParameters: {
        "recipeId": MOCK_RECIPE_ID
    },
    queryStringParameters: {
        "imageExt": "png"
    },
    isBase64Encoded: false,
    requestContext: {
        authorizer: {
            claims: {
                "cognito:username": MOCK_USER_ID
            }
        }
    }
} as any;