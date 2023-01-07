import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import { IIngredient } from '../../../../src/models/ingredient.model';

const MOCK_USER_ID = "0000-0000-0000-00000";
const MOCK_RECIPE_ID = "1000-0000-0000-00000";
const MOCK_INGREDIENT: IIngredient = {
    title: "Bread",
    quantity: 2,
    units: "slices"
};

export const mockContext: Context = {
    functionName: 'create-ingredient'
} as any;
export const mockApiEventInvalidHttpMethod: APIGatewayEvent = {
    httpMethod: 'PUT',
    body: JSON.stringify({}),
    headers: {},
    path: "/recipe/{recipeId}/ingredient",
    pathParameters: null,
    queryStringParameters: null,
    isBase64Encoded: false,
} as any;
export const mockApiEventMissingRecipeId: APIGatewayEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({}),
    headers: {},
    path: "/recipe/{recipeId}/ingredient",
    pathParameters: {
        "recipeId": undefined
    },
    queryStringParameters: null,
    isBase64Encoded: false,
    requestContext: {
    }
} as any;
export const mockApiEventMissingAuthorizer: APIGatewayEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({}),
    headers: {},
    path: "/recipe/{recipeId}/ingredient",
    pathParameters: {
        "recipeId": MOCK_RECIPE_ID
    },
    queryStringParameters: null,
    isBase64Encoded: false,
    requestContext: {
    }
} as any;
export const mockApiEventMissingBody: APIGatewayEvent = {
    httpMethod: 'POST',
    body: null,
    headers: {},
    path: "/recipe/{recipeId}/ingredient",
    pathParameters: {
        "recipeId": MOCK_RECIPE_ID
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
export const mockApiEventValid: APIGatewayEvent = {
    httpMethod: 'POST',
    body: JSON.stringify(MOCK_INGREDIENT),
    headers: {},
    path: "/recipe/{recipeId}/ingredient",
    pathParameters: {
        "recipeId": MOCK_RECIPE_ID
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