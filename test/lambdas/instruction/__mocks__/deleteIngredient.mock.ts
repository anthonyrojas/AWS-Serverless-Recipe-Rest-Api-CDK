import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';

const MOCK_USER_ID = "0000-0000-0000-00000";
const MOCK_RECIPE_ID = "1000-0000-0000-00000";
const MOCK_INGREDIENT_ID = "2000-0000-0000-00000";

export const mockContext: Context = {
    functionName: 'delete-ingredient'
} as any;

export const mockApiEventInvalidHttpMethod: APIGatewayEvent = {
    httpMethod: 'PUT',
    body: JSON.stringify({}),
    headers: {},
    path: "/recipe/{recipeId}/ingredient/{ingredientId}",
    pathParameters: null,
    queryStringParameters: null,
    isBase64Encoded: false,
    requestContext: {}
} as any;
export const mockApiEventMissingPathParams: APIGatewayEvent = {
    httpMethod: 'DELETE',
    body: JSON.stringify({}),
    headers: {},
    path: "/recipe/{recipeId}/ingredient/{ingredientId}",
    pathParameters: {},
    queryStringParameters: null,
    isBase64Encoded: false,
    requestContext: {}
} as any;
export const mockApiEventMissingAuthorizer: APIGatewayEvent = {
    httpMethod: 'DELETE',
    body: JSON.stringify({}),
    headers: {},
    path: "/recipe/{recipeId}/ingredient/{ingredientId}",
    pathParameters: {
        "recipeId": MOCK_RECIPE_ID,
        "ingredientId": MOCK_INGREDIENT_ID
    },
    queryStringParameters: null,
    isBase64Encoded: false,
    requestContext: {}
} as any;
export const mockApiEventValid: APIGatewayEvent = {
    httpMethod: 'DELETE',
    body: JSON.stringify({}),
    headers: {},
    path: "/recipe/{recipeId}/ingredient/{ingredientId}",
    pathParameters: {
        "recipeId": MOCK_RECIPE_ID,
        "ingredientId": MOCK_INGREDIENT_ID
    },
    queryStringParameters: null,
    isBase64Encoded: false,
    requestContext: {
        authorizer: {
            claims: {
                "cognito:username": MOCK_USER_ID
            }
        }
    }
} as any;