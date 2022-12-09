import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import { IInstruction } from '../../../../src/models/instruction.model';

const MOCK_USER_ID = "0000-0000-0000-00000";
const MOCK_RECIPE_ID = "1000-0000-0000-00000";
const MOCK_INSTRUCTION_ID = "1000-0000-0000-00001";

export const MOCK_INSTRUCTION: IInstruction = {
    userId: MOCK_USER_ID,
    itemId: MOCK_INSTRUCTION_ID,
    recipeId: MOCK_RECIPE_ID,
    step: "A step in this recipe",
    order: 1
};
export const mockContext: Context = {
    functionName: 'delete-instruction'
} as any;
export const mockApiEventInvalidHttpMethod: APIGatewayEvent = {
    httpMethod: 'PUT',
    body: null,
    headers: {},
    path: "/recipe/{recipeId}/instruction/{instructionId}",
    pathParameters: null,
    queryStringParameters: null,
    isBase64Encoded: false,
} as any;
export const mockApiEventInvalidPathParams: APIGatewayEvent = {
    httpMethod: 'DELETE',
    body: null,
    headers: {},
    path: "/recipe/{recipeId}/instruction/{instructionId}",
    pathParameters: {},
    queryStringParameters: null,
    isBase64Encoded: false,
} as any;
export const mockApiEventMissingAuthorizer: APIGatewayEvent = {
    httpMethod: 'DELETE',
    body: null,
    headers: {},
    path: "/recipe/{recipeId}/instruction/{instructionId}",
    pathParameters: {
        "recipeId": MOCK_RECIPE_ID,
        "instructionId": MOCK_INSTRUCTION_ID
    },
    queryStringParameters: null,
    isBase64Encoded: false,
    requestContext: {
    }
} as any;
export const mockApiEventValid: APIGatewayEvent = {
    httpMethod: 'DELETE',
    body: null,
    headers: {},
    path: "/recipe/{recipeId}/instruction/{instructionId}",
    pathParameters: {
        "recipeId": MOCK_RECIPE_ID,
        "instructionId": MOCK_INSTRUCTION_ID
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