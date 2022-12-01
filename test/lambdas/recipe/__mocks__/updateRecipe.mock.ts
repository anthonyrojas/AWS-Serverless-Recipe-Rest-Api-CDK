import {
    APIGatewayEvent,
    APIGatewayProxyEventHeaders,
    Context
} from 'aws-lambda';
import { Recipe } from '../../../../src/models/recipe.model';

const USER_ID="0000-0000-0000-00000";

export const mockRecipe = new Recipe(
    USER_ID,
    "Sandwich",
    "A sandwich recipe",
    0,
    10,
    "1111-1111-1111-11111"
);

export const mockContext: Context = {
    functionName: 'update-recipe'
} as any;
const mockHeaders: APIGatewayProxyEventHeaders = {
}
export const mockApiEventInvalidHttpMethod: APIGatewayEvent = {
    httpMethod: 'GET',
    body: null,
    headers: mockHeaders,
    path: "/recipe/{recipeId}",
    pathParameters: {
        "recipeId": mockRecipe.recipeId
    },
    queryStringParameters: null,
    isBase64Encoded: false
} as any;
export const mockApiEventMissingAuthorizer: APIGatewayEvent = {
    httpMethod: 'PUT',
    body: JSON.stringify(mockRecipe.toPutRequestItem()),
    headers: mockHeaders,
    path: "/recipe/{recipeId}",
    pathParameters: {
        "recipeId": mockRecipe.recipeId
    },
    queryStringParameters: null,
    isBase64Encoded: false,
    requestContext: {
    }
} as any;
export const mockApiEventMissingPathParams: APIGatewayEvent = {
    httpMethod: 'PUT',
    body: JSON.stringify(mockRecipe.toPutRequestItem()),
    headers: mockHeaders,
    path: "/recipe/{recipeId}",
    pathParameters: {
        "recipeId": undefined
    },
    queryStringParameters: null,
    isBase64Encoded: false,
    requestContext: {
        authorizer: {
            claims: {
                "cognito:username": USER_ID
            }
        }
    }
} as any
export const mockApiEventValid: APIGatewayEvent = {
    httpMethod: 'PUT',
    body: JSON.stringify(mockRecipe.toPutRequestItem()),
    headers: mockHeaders,
    path: "/recipe/{recipeId}",
    pathParameters: {
        "recipeId": mockRecipe.recipeId
    },
    queryStringParameters: null,
    isBase64Encoded: false,
    requestContext: {
        authorizer: {
            claims: {
                "cognito:username": USER_ID
            }
        }
    }
} as any;