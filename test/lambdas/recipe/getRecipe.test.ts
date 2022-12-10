import {handler} from '../../../src/recipe/get-recipe/index';
// import {IRecipe, Recipe} from '../../../src/models/recipe.model';
import { ddbClient } from '../../../src/utils/DynamoDBClient';
import { QueryCommandOutput, ScanCommandOutput } from '@aws-sdk/client-dynamodb';
import {marshall} from '@aws-sdk/util-dynamodb'
import {
    mockRecipe, 
    mockIngredient, 
    mockInstruction,
    mockApiEventRecipeIdValid,
    mockContext,
    mockApiEventInvalidHttpMethod,
    mockRecipesApiEventValid
} from './__mocks__/getRecipe.mock';
describe("execute get-recipe lambda function for /recipe/:id", () => {
    afterEach((done) => {
        jest.clearAllMocks();
        jest.resetAllMocks();
        done();
    });
    it("should return fail on invalid http method", async () => {
        const res = await handler(mockApiEventInvalidHttpMethod, mockContext);
        expect(res.statusCode).toEqual(405);
    })
    it("should return an empty body given non-existent recipeId", async () => {
        ddbClient.send = jest.fn().mockResolvedValue({
            Items: undefined,
            Count: 0
        } as QueryCommandOutput);
        const res = await handler(mockApiEventRecipeIdValid, mockContext);
        const body = JSON.parse(res.body);
        expect(res.statusCode).toEqual(404);
        expect(ddbClient.send).toBeCalledTimes(1);
        expect(body.recipe).toEqual({});
    })
    it("should return recipe given a recipeId", async () => {
        ddbClient.send = jest.fn().mockResolvedValue({
            Items: [
                marshall(mockRecipe.toPutRequestItem(), {
                    convertClassInstanceToMap: false,
                    convertEmptyValues: true
                }), 
                marshall(mockIngredient.toPutRequestItem(), {
                    convertClassInstanceToMap: false,
                    convertEmptyValues: true
                }), 
                marshall(mockInstruction.toPutRequestItem(), {
                    convertClassInstanceToMap: false,
                    convertEmptyValues: true
                })
            ],
            Count: 3
        } as QueryCommandOutput);
        const res = await handler(mockApiEventRecipeIdValid, mockContext);
        const body = JSON.parse(res.body);
        expect(res.statusCode).toEqual(200);
        expect(ddbClient.send).toBeCalledTimes(1);
        expect(Object.keys(body)).toContain('recipe');
        expect(Object.keys(body).length).toEqual(1);
        expect(Object.keys(body.recipe).length).toEqual(11);
    });
});
describe("execute get-recipe lambda function for /recipe", () => {
    afterEach((done) => {
        jest.clearAllMocks();
        jest.resetAllMocks();
        done();
    });
    it("should return an empty list of recipes given empty table", async () => {
        ddbClient.send = jest.fn().mockResolvedValue({
            Items: undefined,
            Count: 0
        } as QueryCommandOutput);
        const res = await handler(mockRecipesApiEventValid, mockContext);
        const body = JSON.parse(res.body);
        expect(res.statusCode).toEqual(200);
        expect(ddbClient.send).toHaveBeenCalledTimes(1);
        expect(body.recipes.length).toEqual(0);
    });
    it("should return a list of recipes", async () => {
        ddbClient.send = jest.fn().mockResolvedValue({
            Items: [marshall(mockRecipe.toPutRequestItem())],
            Count: 1,
            LastEvaluatedKey: marshall({
                entityType: "RECIPE",
                itemId: mockRecipe.recipeId
            })
        } as QueryCommandOutput);
        const res = await handler(mockRecipesApiEventValid, mockContext);
        const body = JSON.parse(res.body);
        expect(res.statusCode).toEqual(200);
        expect(ddbClient.send).toHaveBeenCalledTimes(1);
        expect(body.recipes.length).toEqual(1);
    });
    it("should return a list of recipes given pagination", async () => {
        ddbClient.send = jest.fn().mockResolvedValue({
            Items: [marshall(mockRecipe.toPutRequestItem())],
            Count: 1,
            LastEvaluatedKey: marshall({
                entityType: "RECIPE",
                itemId: mockRecipe.recipeId
            })
        } as QueryCommandOutput);
        const res = await handler(mockRecipesApiEventValid, mockContext);
        const body = JSON.parse(res.body);
        expect(res.statusCode).toEqual(200);
        expect(ddbClient.send).toHaveBeenCalledTimes(1);
        expect(body.recipes.length).toEqual(1);
    });
});