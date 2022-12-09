import {
    BatchWriteItemCommandOutput, 
    PutItemCommandOutput, 
    QueryCommandOutput 
} from "@aws-sdk/client-dynamodb";
import { handler } from "../../../src/instruction/create-instruction";
import { marshall } from "@aws-sdk/util-dynamodb";
import { ddbClient } from "../../../src/utils/DynamoDBClient";
import {
    MOCK_INSTRUCTION,
    mockContext,
    mockApiEventInvalidHttpMethod,
    mockApiEventMissingPathParams,
    mockApiEventMissingAuthorizer,
    mockApiEventMissingBody,
    mockApiEventValid,
    mockApiEventValidWithCollision
} from './__mocks__/createInstruction.mock';

describe("execute create-instruction lambda function", () => {
    afterEach((done) => {
        jest.clearAllMocks();
        jest.resetAllMocks();
        done();
    })
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
    it("should fail given missing request body", async () => {
        const res = await handler(mockApiEventMissingBody, mockContext);
        expect(res.statusCode).toEqual(400);
    });
    it("should fail given ddbClient error thrown", async () => {
        ddbClient.send = jest.fn()
        .mockResolvedValueOnce({
            Items: [marshall(MOCK_INSTRUCTION)],
            Count: 1,
            $metadata: {
                httpStatusCode: 200
            }
        } as QueryCommandOutput)
        .mockRejectedValueOnce({
            $metadata: {
                httpStatusCode: 400
            }
        } as PutItemCommandOutput)
        const res = await handler(mockApiEventValid, mockContext);
        expect(res.statusCode).toEqual(400);
        expect(ddbClient.send).toBeCalledTimes(2);
    });
    it("should succeed given ddbClients 0 instructions in query command", async () => {
        ddbClient.send = jest.fn()
        .mockResolvedValueOnce({
            $metadata: {
                httpStatusCode: 200
            },
            Items: [],
            Count: 0
        } as QueryCommandOutput)
        .mockResolvedValueOnce({
            $metadata: {
                httpStatusCode: 200
            }
        } as PutItemCommandOutput)
        const res = await handler(mockApiEventValid, mockContext);
        expect(res.statusCode).toEqual(200);
        expect(Object.keys(JSON.parse(res.body))).toContain("instruction");
        expect(ddbClient.send).toBeCalledTimes(2);
    })
    it("should succeed given ddbClient finds 1 instructions in query command", async () => {
        ddbClient.send = jest.fn()
        .mockResolvedValueOnce({
            $metadata: {
                httpStatusCode: 200
            },
            Items: [marshall(MOCK_INSTRUCTION)],
            Count: 1
        } as QueryCommandOutput)
        .mockResolvedValueOnce({
            $metadata: {
                httpStatusCode: 200
            }
        } as PutItemCommandOutput);
        const res = await handler(mockApiEventValid, mockContext);
        expect(res.statusCode).toEqual(200);
        expect(Object.keys(JSON.parse(res.body))).toContain("instruction");
        expect(ddbClient.send).toBeCalledTimes(2);
    });
    it("should succeed given that new instruction requires reordering", async () => {
        ddbClient.send = jest.fn()
        .mockResolvedValueOnce({
            $metadata: {
                httpStatusCode: 200
            },
            Items: [marshall(MOCK_INSTRUCTION)],
            Count: 1
        } as QueryCommandOutput)
        .mockResolvedValueOnce({
            $metadata: {
                httpStatusCode: 200
            },
            UnprocessedItems: undefined
        } as BatchWriteItemCommandOutput);
        const res = await handler(mockApiEventValidWithCollision, mockContext);
        expect(res.statusCode).toEqual(200);
        expect(Object.keys(JSON.parse(res.body))).toContain("instruction");
        expect(ddbClient.send).toBeCalledTimes(2);
    });
});