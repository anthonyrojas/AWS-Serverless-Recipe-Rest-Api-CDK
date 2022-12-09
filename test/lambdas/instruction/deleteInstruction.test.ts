import { DeleteItemCommandOutput, InternalServerError } from "@aws-sdk/client-dynamodb";
import { handler } from "../../../src/instruction/delete-instruction";
import { ddbClient } from "../../../src/utils/DynamoDBClient";
import { 
    mockContext,
    mockApiEventInvalidHttpMethod,
    mockApiEventInvalidPathParams,
    mockApiEventMissingAuthorizer,
    mockApiEventValid
} from "./__mocks__/deleteInstruction.mock";

describe("execute delete-instruction lambda function", () => {
    afterEach((done) => {
        jest.clearAllMocks();
        jest.resetAllMocks();
        done();
    });
    it("should fail given invalid http method", async () => {
        const res = await handler(mockApiEventInvalidHttpMethod, mockContext);
        expect(res.statusCode).toEqual(405);
    });
    it("should fail given missing path params", async () => {
        const res = await handler(mockApiEventInvalidPathParams, mockContext);
        expect(res.statusCode).toEqual(404);
    });
    it("should fail given missing authorizer", async () => {
        const res = await handler(mockApiEventMissingAuthorizer, mockContext);
        expect(res.statusCode).toEqual(403);
    });
    it("should fail given ddbClient throws error", async () => {
        ddbClient.send = jest.fn().mockRejectedValue({
            $metadata: {
                httpStatusCode: 500
            },
            message: "Internal server error"
        } as InternalServerError);
        const res = await handler(mockApiEventValid, mockContext);
        expect(res.statusCode).toEqual(400);
        expect(Object.keys(JSON.parse(res.body))).toContain("message");
        expect(ddbClient.send).toBeCalledTimes(1);
    });
    it("should succeed given valid request", async () => {
        ddbClient.send = jest.fn().mockResolvedValue({
            $metadata: {
                httpStatusCode: 200
            }
        } as DeleteItemCommandOutput);
        const res = await handler(mockApiEventValid, mockContext);
        expect(res.statusCode).toEqual(200);
        expect(Object.keys(JSON.parse(res.body))).toContain("message");
        expect(ddbClient.send).toBeCalledTimes(1);
    })
});