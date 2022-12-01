import { handler } from "../../../src/recipe/update-recipe-image";
import { ddbClient } from "../../../src/utils/DynamoDBClient";
import {
    BatchExecuteStatementCommandOutput,
} from '@aws-sdk/client-dynamodb';
import {
    mockContext,
    mockS3EventEmptyRecords,
    mockS3EventInvalid,
    mockS3EventValid
} from './__mocks__/updateRecipeImage.mock'

describe("execute update-recipe-image lambda function", () => {
    beforeEach(() => {
        const bucketUrl = "https://s3example.com";
        process.env.RECIPE_IMAGE_BUCKET_DOMAIN_NAME = bucketUrl;
    });
    afterEach((done) => {
        jest.clearAllMocks();
        jest.resetAllMocks();
        done();
    })
    it("should succeed given no records", async () => {
        const res = await handler(mockS3EventEmptyRecords, mockContext);
        expect(res).toEqual(false);
    });
    it("should succeed given an invalid record set", async () => {
        ddbClient.send = jest.fn().mockResolvedValue({
            Responses: [{}]
        } as BatchExecuteStatementCommandOutput)
        const res = await handler(mockS3EventInvalid, mockContext);
        expect(res).toEqual(true)
        expect(ddbClient.send).toHaveBeenCalledTimes(1);
    });
    it("should success given a valid record set", async () => {
        ddbClient.send = jest.fn().mockResolvedValue({
            Responses: [{}, {}]
        });
        const res = await handler(mockS3EventValid, mockContext);
        expect(res).toEqual(true);
        expect(ddbClient.send).toHaveBeenCalledTimes(1);
    })
})