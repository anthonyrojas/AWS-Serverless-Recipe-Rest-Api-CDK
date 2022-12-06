import { ddbClient } from "../../../src/utils/DynamoDBClient";
import { handler } from "../../../src/ingredient/delete-ingredient";
import { 
    mockContext,
    mockApiEventInvalidHttpMethod,
    mockApiEventMissingPathParams,
    mockApiEventMissingAuthorizer,
    mockApiEventValid
} from "./__mocks__/deleteIngredient.mock";
import { DeleteItemCommandOutput } from "@aws-sdk/client-dynamodb";

describe("execute delete-ingredient lambda function", () => {
    it("should fail given invalid http method", async () => {
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
    it("should fail given ingredientId that does not exist in db", async () => {
        ddbClient.send = jest.fn().mockRejectedValue({
            $metadata: {
                httpStatusCode: 404
            }
        } as DeleteItemCommandOutput);
        const res = await handler(mockApiEventValid, mockContext);
        expect(res.statusCode).toEqual(400);
        expect(ddbClient.send).toBeCalledTimes(1);
    });
    it("should succeed given valid request with existing path params", async () => {
        ddbClient.send = jest.fn().mockResolvedValue({
            $metadata: {
                httpStatusCode: 200
            }
        } as DeleteItemCommandOutput);
        const res = await handler(mockApiEventValid, mockContext);
        expect(res.statusCode).toEqual(200);
        expect(ddbClient.send).toBeCalledTimes(1);
        expect(Object.keys(JSON.parse(res.body))).toContain("message");
    });
})