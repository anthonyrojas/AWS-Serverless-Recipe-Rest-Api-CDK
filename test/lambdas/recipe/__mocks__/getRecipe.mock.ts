import {
    APIGatewayEvent,
    APIGatewayProxyEventHeaders,
    Context
} from 'aws-lambda';
import { Ingredient } from '../../../../src/models/ingredient.model';
import { Instruction } from '../../../../src/models/instruction.model';
import { IRecipe, Recipe } from '../../../../src/models/recipe.model';

const USER_ID="0000-0000-0000-00000";

export const mockRecipe = new Recipe(
    USER_ID, 
    "Sandwich",
    "A sandwich recipe",
    0,
    10,
    "1111-1111-1111-1111"
);
export const mockIngredient = new Ingredient(
    mockRecipe.recipeId,
    USER_ID,
    "Bread",
    2,
    "slices"
);
export const mockInstruction = new Instruction(
    mockRecipe.recipeId,
    USER_ID,
    "Create a wonderful sandwich.",
    1
);
export const mockContext: Context = {
    functionName: 'get-recipe'
} as any;
const mockHeaders: APIGatewayProxyEventHeaders = {
}
export const mockApiEventRecipeIdValid: APIGatewayEvent = {
    httpMethod: 'GET',
    body: null,
    headers: mockHeaders,
    path: `/recipe/{recipeId}`,
    pathParameters: {
        "recipeId": mockRecipe.recipeId
    },
    queryStringParameters: null,
    isBase64Encoded: false
} as any;
export const mockApiEventInvalidHttpMethod: APIGatewayEvent = {
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
export const mockRecipesApiEventValid: APIGatewayEvent = {
    httpMethod: 'GET',
    body: null,
    headers: mockHeaders,
    path: "/recipe",
    queryStringParameters: null,
    isBase64Encoded: false
} as any;
export const mockRecipesApiEventValidWithPagination: APIGatewayEvent = {
    httpMethod: 'GET',
    body: null,
    headers: mockHeaders,
    path: "/recipe",
    queryStringParameters: {
        "paginationPk": "RECIPE",
        "paginationSk": "1100-0000-0000-00000"
    },
    isBase64Encoded: false
} as any;