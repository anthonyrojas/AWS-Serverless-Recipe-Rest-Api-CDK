import {handler} from '../../../src/recipe/update-recipe/index';
import {ddbClient} from '../../../src/utils/DynamoDBClient';
import { marshall } from '@aws-sdk/util-dynamodb';
import {
    mockContext,
    mockRecipe,
    mockApiEventInvalidHttpMethod,
    mockApiEventMissingAuthorizer,
    mockApiEventMissingPathParams,
    mockApiEventValid
} from './__mocks__/updateRecipe.mock';
import { PutItemCommandOutput, ResourceNotFoundException } from '@aws-sdk/client-dynamodb';

describe("execute update-recipe lambda function", () => {
    afterEach((done) => {
        jest.clearAllMocks();
        jest.resetAllMocks();
        done();
    });
    it("should return fail given invalid http method", async () => {
        const res = await handler(mockApiEventInvalidHttpMethod, mockContext);
        expect(res.statusCode).toEqual(405);
    });
    it("should return fail given missing authorizer", async () => {
        const res = await handler(mockApiEventMissingAuthorizer, mockContext);
        expect(res.statusCode).toEqual(403);
    });
    it("should return fail given missing path params", async () => {
        const res = await handler(mockApiEventMissingPathParams, mockContext);
        expect(res.statusCode).toEqual(400);
    });
    it("should return success given valid request body", async () => {
        ddbClient.send = jest.fn().mockResolvedValue({
            $metadata: {
                httpStatusCode: 200
            }
        } as PutItemCommandOutput);
        const res = await handler(mockApiEventValid, mockContext);
        expect(res.statusCode).toEqual(200);
        expect(ddbClient.send).toHaveBeenCalledTimes(1);
    });
    it("should return fail given ddbClient throws an exception", async () => {
        ddbClient.send = jest.fn().mockRejectedValue({
            message: "Failed to update resource. Could not find record that matches key."
        } as ResourceNotFoundException);
        const res = await handler(mockApiEventValid, mockContext);
        expect(res.statusCode).toEqual(400);
        expect(ddbClient.send).toHaveBeenCalledTimes(1);
    })
});