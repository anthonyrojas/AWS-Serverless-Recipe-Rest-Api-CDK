import { ddbClient } from "../../../src/utils/DynamoDBClient";
import { handler } from "../../../src/ingredient/update-ingredient";
import {
    mockContext,
    mockApiEventInvalidHttpMethod,
    mockApiEventMissingPathParams,
    mockApiEventMissingAuthorizer,
    mockApiEventMissingBody,
    mockApiEventValid
} from "./__mocks__/updateIngredient.mock";
import { PutItemCommandOutput } from "@aws-sdk/client-dynamodb";

describe("execute update-ingredient lambda function", () => {
    afterEach((done) => {
        jest.clearAllMocks();
        jest.resetAllMocks();
        done();
    });
    it("should fail given invalid HTTP method", async () => {
        const res = await handler(mockApiEventInvalidHttpMethod, mockContext);
        expect(res.statusCode).toEqual(405);
    });
    it("should fail given missing path params", async () => {
        const res = await handler(mockApiEventMissingPathParams, mockContext);
        expect(res.statusCode).toEqual(404);
    });
    it("should fail given missing authorizer", async () => {
        const res = await handler(mockApiEventMissingAuthorizer, mockContext);
        expect(res.statusCode).toEqual(403);
    });
    it("should fail given missing request body", async () => {
        const res = await handler(mockApiEventMissingBody, mockContext);
        expect(res.statusCode).toEqual(400);
    });
    it("should fail given ddbClient throws error", async () => {
        ddbClient.send = jest.fn().mockRejectedValue({
            $metadata: {
                httpStatusCode: 400
            }
        } as PutItemCommandOutput);
        const res = await handler(mockApiEventValid, mockContext);
        expect(res.statusCode).toEqual(400);
        expect(ddbClient.send).toHaveBeenCalledTimes(1);
    });
    it("should succeed given valid request", async () => {
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