import { BatchExecuteStatementCommandOutput, PutItemCommandOutput } from "@aws-sdk/client-dynamodb";
import { handler } from "../../../src/instruction/update-instruction";
import { ddbClient } from "../../../src/utils/DynamoDBClient";
import {
    MOCK_RECIPES_TABLE,
    mockContext,
    mockApiEventInvalidHttpMethod,
    mockApiEventInvalidPathParams,
    mockApiEventMissingAuthorizer,
    mockApiEventValidIndividualUpdate,
    mockApiEventValidReorder
} from './__mocks__/updateInstruction.mock'

describe("execute update-instruction lambda function", () => {
    beforeAll(() => {
        process.env.RECIPES_TABLE_NAME = MOCK_RECIPES_TABLE;
    })
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
        const res = await handler(mockApiEventInvalidPathParams, mockContext);
        expect(res.statusCode).toEqual(404);
    });
    it("should fail given missing authorizer", async () => {
        const res = await handler(mockApiEventMissingAuthorizer, mockContext);
        expect(res.statusCode).toEqual(403);
    });
    it("should succeed updating single record given valid request", async () => {
        ddbClient.send = jest.fn().mockResolvedValue({
            $metadata: {
                httpStatusCode: 200
            }
        } as PutItemCommandOutput);
        const res = await handler(mockApiEventValidIndividualUpdate, mockContext);
        expect(res.statusCode).toEqual(200);
        expect(Object.keys(JSON.parse(res.body))).toContain("instruction");
        expect(ddbClient.send).toHaveBeenCalledTimes(1);
    });
    it("should succeed reordering multiple records", async () => {
        ddbClient.send = jest.fn().mockResolvedValue({
            $metadata: {
                httpStatusCode: 200
            },
            Responses: [
                {},
                {}
            ]
        } as BatchExecuteStatementCommandOutput);
        const res = await handler(mockApiEventValidReorder, mockContext);
        expect(res.statusCode).toEqual(200);
        expect(ddbClient.send).toBeCalledTimes(1);
        const body = JSON.parse(res.body);
        const bodyKeys = Object.keys(body);
        expect(bodyKeys.length).toEqual(2);
    })
})