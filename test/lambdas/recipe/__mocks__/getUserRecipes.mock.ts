import {
    APIGatewayEvent,
    APIGatewayProxyEventHeaders,
    Context
} from 'aws-lambda';
import { IRecipe } from '../../../../src/models/recipe.model';

const USER_ID = "0000-0000-0000-00000";

export const mockRecipe: IRecipe = {
    userId: USER_ID,
    itemId: "1111-1111-1111-11111",
    searchName: "sandwich",
    title: "Sandwich",
    prepTime: 10,
    cookTime: 0,
    entityType: "RECIPE",
    description: "a sandwich recipe"
}

const mockHeaders: APIGatewayProxyEventHeaders = {
}
export const mockContext: Context = {
    functionName: "get-user-recipe"
} as any;
export const mockApiEventRecipeInvalidHttpMethod: APIGatewayEvent = {
    httpMethod: 'POST',
    body: null,
    headers: mockHeaders,
    path: `/recipe/{recipeId}`,
    pathParameters: {
        "recipeId": mockRecipe.recipeId
    },
    queryStringParameters: null,
    isBase64Encoded: false
} as any;
export const mockRecipesApiEventValidWithLimitQueryString: APIGatewayEvent = {
    httpMethod: 'GET',
    body: null,
    headers: mockHeaders,
    path: "/recipes/{userId}",
    queryStringParameters: {
        "limit": 1
    },
    isBase64Encoded: false,
    pathParameters: {
        "userId": USER_ID
    },
} as any;
export const mockRecipesApiEventValid: APIGatewayEvent = {
    httpMethod: 'GET',
    body: null,
    headers: mockHeaders,
    path: "/recipes/{userId}",
    queryStringParameters: {},
    isBase64Encoded: false,
    pathParameters: {
        "userId": USER_ID
    }
} as any;