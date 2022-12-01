import {handler} from '../../../src/recipe/create-recipe/index';
import {ddbClient} from '../../../src/utils/DynamoDBClient';
import {
    mockContext,
    mockApiEventMissingAuthorizer,
    mockApiEventMissingBody,
    mockApiEventValid,
    mockApiEventInvalidHttpMethod,
    mockApiEventValidMissingIngredientAndInstruction
} from './__mocks__/createRecipe.mock';
import {InternalServerError} from '@aws-sdk/client-dynamodb'

describe("execute create-recipe lambda function", () => {
    ddbClient.send = jest.fn().mockResolvedValue({
        $metadata: {
            httpStatusCode: 200
        }
    });
    afterEach((done) => {
        jest.clearAllMocks();
        jest.resetAllMocks();
        done();
    });
    it("should return fail given unsupported HTTP method", async () => {
        const response = await handler(mockApiEventInvalidHttpMethod, mockContext);
        expect(response.statusCode).toEqual(405);
    });

    it("should return fail given no authorizer", async () => {
        const response = await handler(mockApiEventMissingAuthorizer, mockContext);
        expect(response.statusCode).toEqual(403);
    });
    it("shoud return fail given null body", async () => {
        const res = await handler(mockApiEventMissingBody, mockContext);
        expect(res.statusCode).toEqual(400);
    });
    it("should return new recipe given no ingrednients and no instructions", async () => {
        const res = await handler(mockApiEventValidMissingIngredientAndInstruction, mockContext);
        expect(res.statusCode).toEqual(200);
        expect(ddbClient.send).toBeCalledTimes(1);
        expect(Object.keys(JSON.parse(res.body))).toContain('recipe');
    });
    it("should return new recipe given ingredients and instructions", async () => {
        const res = await handler(mockApiEventValid, mockContext);
        expect(res.statusCode).toEqual(200);
        expect(ddbClient.send).toBeCalledTimes(1);
        expect(Object.keys(JSON.parse(res.body))).toContain('recipe');
    });
    it("should return fail given ddbClient error thrown", async () => {
        ddbClient.send = jest.fn().mockRejectedValueOnce({
            message: 'DDB Client internal server error for unit testing'
        } as InternalServerError);
        const res = await handler(mockApiEventValid, mockContext);
        const body = JSON.parse(res.body);
        expect(res.statusCode).toEqual(400);
        expect(ddbClient.send).toBeCalledTimes(1);
        expect(Object.keys(body)).toContain("error")
    })
})