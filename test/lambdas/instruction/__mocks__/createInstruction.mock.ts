import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import { IInstruction } from '../../../../src/models/instruction.model';

const MOCK_USER_ID = "0000-0000-0000-00000";
const MOCK_RECIPE_ID = "1000-0000-0000-00000";
const MOCK_INSTRUCTION_ID = "1000-0000-0000-00001";
const MOCK_INSTRUCTION_ID_2 = "1000-0000-0000-00002";

export const MOCK_INSTRUCTION: IInstruction = {
    userId: MOCK_USER_ID,
    itemId: MOCK_INSTRUCTION_ID,
    recipeId: MOCK_RECIPE_ID,
    step: "A step in this recipe",
    order: 1
};
export const MOCK_INSTRUCTION_2: IInstruction = {
    userId: MOCK_USER_ID,
    itemId: MOCK_INSTRUCTION_ID_2,
    recipeId: MOCK_RECIPE_ID,
    step: "Another step in this recipe",
    order: 2
}
const MOCK_INSTRUCTION_COLLISION: IInstruction = {
    userId: MOCK_USER_ID,
    itemId: MOCK_INSTRUCTION_ID_2,
    recipeId: MOCK_RECIPE_ID,
    step: "Another step in this recipe",
    order: 1
}
export const mockContext: Context = {
    functionName: 'create-instruction'
} as any;
export const mockApiEventInvalidHttpMethod: APIGatewayEvent = {
    httpMethod: 'PUT',
    body: JSON.stringify({}),
    headers: {},
    path: "/recipe/{recipeId}/instruction",
    pathParameters: null,
    queryStringParameters: null,
    isBase64Encoded: false,
} as any;
export const mockApiEventMissingPathParams: APIGatewayEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({}),
    headers: {},
    path: "/recipe/{recipeId}/instruction",
    pathParameters: {
        "recipeId": undefined
    },
    queryStringParameters: null,
    isBase64Encoded: false,
} as any;
export const mockApiEventMissingAuthorizer: APIGatewayEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({}),
    headers: {},
    path: "/recipe/{recipeId}/instruction",
    pathParameters: {
        "recipeId": MOCK_RECIPE_ID
    },
    queryStringParameters: null,
    isBase64Encoded: false,
    requestContext: {}
} as any
export const mockApiEventMissingBody: APIGatewayEvent = {
    httpMethod: 'POST',
    body: null,
    headers: {},
    path: "/recipe/{recipeId}/instruction",
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
    body: JSON.stringify(MOCK_INSTRUCTION_2),
    headers: {},
    path: "/recipe/{recipeId}/instruction",
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
export const mockApiEventValidWithCollision: APIGatewayEvent = {
    httpMethod: 'POST', 
    body: JSON.stringify(MOCK_INSTRUCTION_COLLISION),
    headers: {},
    path: "/recipe/{recipeId}/instruction",
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