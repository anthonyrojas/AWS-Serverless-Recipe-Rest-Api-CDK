import {
    APIGatewayEvent,
    APIGatewayProxyEventHeaders,
    Context
} from 'aws-lambda';

const USER_ID="0000-0000-0000-00000";
const RECIPE_ID="1111-1111-1111-11111";
import { Ingredient } from '../../../../src/models/ingredient.model';
import { Instruction } from '../../../../src/models/instruction.model';
import { Recipe } from '../../../../src/models/recipe.model';

export const mockRecipe = new Recipe(
    USER_ID, 
    "Sandwich",
    "A sandwich recipe",
    0,
    10,
    RECIPE_ID
);
export const mockIngredient = new Ingredient(
    RECIPE_ID,
    USER_ID,
    "Bread",
    2,
    "slices"
);
export const mockInstruction = new Instruction(
    RECIPE_ID,
    USER_ID,
    "Create a wonderful sandwich.",
    1
);

export const mockContext: Context = {
    functionName: 'delete-recipe'
} as any;
export const mockApiEventInvalidHttpMethod: APIGatewayEvent = {
    httpMethod: 'GET',
    body: null,
    headers: {},
    path: "/recipe/{recipeId}"
} as any;
export const mockApiEventMissingPathParams: APIGatewayEvent = {
    httpMethod: 'DELETE',
    body: null,
    headers: {},
    path: "/recipe/{recipeId}",
    pathParameters: {},
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
export const mockApiEventMissingAuthorizer: APIGatewayEvent = {
    httpMethod: 'DELETE',
    body: null,
    headers: {},
    path: "/recipe/{recipeId}",
    pathParameters: {},
    queryStringParameters: null,
    isBase64Encoded: false,
    requestContext: {
    }
} as any;
export const mockApiEventValid: APIGatewayEvent = {
    httpMethod: 'DELETE',
    body: null,
    headers: {},
    path: "/recipe/{recipeId}",
    queryStringParameters: null,
    isBase64Encoded: false,
    pathParameters: {
        "recipeId": RECIPE_ID
    },
    requestContext: {
        authorizer: {
            claims: {
                "cognito:username": USER_ID
            }
        }
    }
} as any;