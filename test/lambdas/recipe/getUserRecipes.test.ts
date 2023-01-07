import { handler } from "../../../src/recipe/get-user-recipe";
import { ddbClient } from "../../../src/utils/DynamoDBClient";
import { DynamoDBServiceException, QueryCommandOutput } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { 
    mockApiEventRecipeInvalidHttpMethod, 
    mockContext, 
    mockRecipe, 
    mockRecipesApiEventValid,
    mockRecipesApiEventValidWithLimitQueryString
} from "./__mocks__/getUserRecipes.mock";

describe("execute get-user-recipes lambda function for /recipes/:userId", () => {
    afterEach((done) => {
        jest.clearAllMocks();
        jest.resetAllMocks();
        done();
    });
    it("should return fail on invalid http method", async () => {
        const res = await handler(mockApiEventRecipeInvalidHttpMethod, mockContext);
        expect(res.statusCode).toEqual(405);
    })
    it("should return error given ddbClient throws error", async () => {
        ddbClient.send = jest.fn().mockRejectedValueOnce({
            message: "Failed to retrieve records"
        } as DynamoDBServiceException);
        const res = await handler(mockRecipesApiEventValid, mockContext);
        expect(res.statusCode).toEqual(400);
        expect(ddbClient.send).toBeCalledTimes(1);
    })
    it("should return a list of recipes given limit query param", async () => {
        ddbClient.send = jest.fn().mockResolvedValueOnce({
            Items: [
                marshall(mockRecipe)
            ],
            Count: 1
        } as QueryCommandOutput);
        const res = await handler(mockRecipesApiEventValidWithLimitQueryString, mockContext);
        expect(res.statusCode).toEqual(200);
        expect(ddbClient.send).toBeCalledTimes(1);
    })
    it("should return a list of recipes given no limit", async () => {
        ddbClient.send = jest.fn().mockResolvedValueOnce({
            Items: [
                marshall(mockRecipe)
            ],
            Count: 1
        } as QueryCommandOutput);
        const res = await handler(mockRecipesApiEventValid, mockContext);
        expect(res.statusCode).toEqual(200);
        expect(ddbClient.send).toBeCalledTimes(1);
    })
})