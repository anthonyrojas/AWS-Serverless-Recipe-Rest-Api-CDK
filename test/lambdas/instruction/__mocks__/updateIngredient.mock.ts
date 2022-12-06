import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import { Ingredient } from '../../../../src/models/ingredient.model';
const MOCK_USER_ID = "0000-0000-0000-00000";
const MOCK_INGREDIENT_ID = "0000-0000-0000-00001";
const MOCK_RECIPE_ID = "0000-0000-0000-00002";

const mockIngredient = new Ingredient(
    MOCK_RECIPE_ID,
    MOCK_USER_ID,
    "Bread",
    3,
    "Slices",
    MOCK_INGREDIENT_ID
);
export const mockContext: Context = {
    functionName: 'update-recipe'
} as any;
export const mockApiEventInvalidHttpMethod: APIGatewayEvent = {
    httpMethod: 'POST',
    body: null,
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
export const mockApiEventMissingPathParams: APIGatewayEvent = {
    httpMethod: 'PUT',
    body: null,
    headers: {},
    path: "/recipe/{recipeId}/ingredient/{ingredientId}",
    pathParameters: {
        "recipeId": MOCK_RECIPE_ID,
        "ingredientId": undefined
    },
    queryStringParameters: null,
    isBase64Encoded: false,
    requestContext: {}
} as any;
export const mockApiEventMissingAuthorizer: APIGatewayEvent = {
    httpMethod: 'PUT',
    body: null,
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
export const mockApiEventMissingBody: APIGatewayEvent = {
    httpMethod: 'PUT',
    body: null,
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
export const mockApiEventValid: APIGatewayEvent = {
    httpMethod: 'PUT',
    body: JSON.stringify(mockIngredient.toPutRequestItem()),
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