import {
    APIGatewayEvent,
    APIGatewayProxyEventHeaders,
    Context
} from 'aws-lambda';

const mockHeaders: APIGatewayProxyEventHeaders = {
}

export const mockContext: Context = {
    functionName: 'create-recipe'
} as any;
export const mockApiEventInvalidHttpMethod: APIGatewayEvent = {
    httpMethod: 'PUT',
    body: JSON.stringify({}),
    headers: mockHeaders,
    path: "/recipe",
    pathParameters: null,
    queryStringParameters: null,
    isBase64Encoded: false,
} as any;

export const mockApiEventMissingAuthorizer: APIGatewayEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({}),
    headers: mockHeaders,
    path: "/recipe",
    pathParameters: null,
    queryStringParameters: null,
    isBase64Encoded: false,
    requestContext: {
    }
} as any;

export const mockApiEventMissingBody: APIGatewayEvent = {
    httpMethod: 'POST',
    body: null,
    headers: {},
    path: "/recipe",
    pathParameters: null,
    queryStringParameters: null,
    isBase64Encoded: false,
    requestContext: {
        authorizer: {
            claims: {
                "cognito:username": "sometestuser1"
            }
        }
    }
} as any;

export const mockApiEventValidMissingIngredientAndInstruction: APIGatewayEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
        title: "Sandwich",
        description: "An awesome sandwich recipe!",
        prepTime: 10,
        cookTime: 0,
        imageUrls: [],
        ingredients: [],
        instructions: [],
        userId: "sometestuser1"
    }),
    headers: {},
    path: "/recipe",
    pathParameters: null,
    queryStringParameters: null,
    isBase64Encoded: false,
    requestContext: {
        authorizer: {
            claims: {
                "cognito:username": "sometestuser1"
            }
        }
    }
} as any;

export const mockApiEventValid: APIGatewayEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
        title: "Sandwich",
        description: "An awesome sandwich recipe!",
        prepTime: 10,
        cookTime: 0,
        imageUrls: [],
        ingredients: [{
            title: 'Bread',
            units: 'slices',
            quantity: 2
        }],
        instructions: [{
            order: 1,
            step: 'Create the sandwich!'
        }],
        userId: "sometestuser1"
    }),
    headers: {},
    path: "/recipe",
    pathParameters: null,
    queryStringParameters: null,
    isBase64Encoded: false,
    requestContext: {
        authorizer: {
            claims: {
                "cognito:username": "sometestuser1"
            }
        }
    }
} as any;