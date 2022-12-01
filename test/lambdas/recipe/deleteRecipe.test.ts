import { BatchWriteItemCommandOutput, InternalServerError, QueryCommand, QueryCommandOutput } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { handler } from "../../../src/recipe/delete-recipe";
import { ddbClient } from "../../../src/utils/DynamoDBClient";
import {
    mockContext,
    mockApiEventInvalidHttpMethod,
    mockApiEventMissingAuthorizer,
    mockApiEventMissingPathParams,
    mockApiEventValid,
    mockIngredient,
    mockInstruction,
    mockRecipe
} from './__mocks__/deleteRecipe.mock';

describe("execute delete-recipe lambda function", () => {
    afterEach((done) => {
        jest.clearAllMocks();
        jest.resetAllMocks();
        done();
    });
    it("should return fail given unsupported HTTP method", async () => {
        const res = await handler(mockApiEventInvalidHttpMethod, mockContext);
        expect(res.statusCode).toEqual(405);
    });
    it("should return fail given no authorizer", async () => {
        const res = await handler(mockApiEventMissingAuthorizer, mockContext);
        expect(res.statusCode).toEqual(403);
    });
    it("should return fail given missing path params", async () => {
        const res = await handler(mockApiEventMissingPathParams, mockContext);
        expect(res.statusCode).toEqual(404);
    });
    it("should return success given valid request", async () => {
        ddbClient.send = jest.fn().mockResolvedValueOnce({
            $metadata: {
                httpStatusCode: 200
            },
            Items: [
                marshall(mockRecipe.toPutRequestItem()),
                marshall(mockIngredient.toPutRequestItem()),
                marshall(mockInstruction.toPutRequestItem())
            ],
            Count: 3
        } as QueryCommandOutput)
        .mockResolvedValueOnce({
            $metadata: {
                httpStatusCode: 200
            }
        } as BatchWriteItemCommandOutput);
        const res = await handler(mockApiEventValid, mockContext);
        expect(res.statusCode).toEqual(200);
        expect(ddbClient.send).toHaveBeenCalledTimes(2);
    });
    it("should return fail given recipe not found in query command", async () => {
        ddbClient.send = jest.fn().mockResolvedValue({
            $metadata: {
                httpStatusCode: 200,
            },
            Item: undefined,
            Count: 0
        } as QueryCommandOutput);
        const res = await handler(mockApiEventValid, mockContext);
        expect(res.statusCode).toEqual(404);
        expect(ddbClient.send).toBeCalledTimes(1);
    });
    it("should return fail given ddbClient throws error", async () => {
        ddbClient.send = jest.fn().mockRejectedValue({
            $metadata: {
                httpStatusCode: 500
            }
        } as InternalServerError);
        const res = await handler(mockApiEventValid, mockContext);
        expect(res.statusCode).toEqual(400);
        expect(ddbClient.send).toBeCalledTimes(1);
    })
})