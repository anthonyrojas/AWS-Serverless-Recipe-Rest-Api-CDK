import { ddbClient } from "../../../src/utils/DynamoDBClient";
import { handler } from "../../../src/ingredient/create-ingredient";
import {
    mockApiEventInvalidHttpMethod,
    mockApiEventMissingAuthorizer,
    mockApiEventMissingBody,
    mockApiEventMissingRecipeId,
    mockApiEventValid,
    mockContext
} from './__mocks__/createIngredient.mock'
import { PutItemCommandOutput } from "@aws-sdk/client-dynamodb";


describe("execute create-ingredient lambda function", () => {
    afterEach((done) => {
        jest.clearAllMocks();
        jest.resetAllMocks();
        done();
    });
    it("should return fail given unsupported HTTP method", async () => {        
        const res = await handler(mockApiEventInvalidHttpMethod, mockContext);
        expect(res.statusCode).toEqual(405);
    });
    it("should return fail given missing recipeId", async () => {
        const res = await handler(mockApiEventMissingRecipeId, mockContext);
        expect(res.statusCode).toEqual(404);
    });
    it("should return fail given missing authorizer", async () => {
        const res = await handler(mockApiEventMissingAuthorizer, mockContext);
        expect(res.statusCode).toEqual(403);
    });
    it("should return fail given missing request body", async () => {
        const res = await handler(mockApiEventMissingBody, mockContext);
        expect(res.statusCode).toEqual(400);
    });
    it("should return success given valid request", async () => {
        ddbClient.send = jest.fn().mockResolvedValue({
            $metadata: {
                httpStatusCode: 200
            }
        } as PutItemCommandOutput);
        const res = await handler(mockApiEventValid, mockContext);
        expect(res.statusCode).toEqual(200);
        expect(ddbClient.send).toHaveBeenCalledTimes(1);
    })
})