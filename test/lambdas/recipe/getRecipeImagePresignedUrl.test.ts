import {handler} from '../../../src/recipe/get-recipe-image-presigned-url/index';
import { 
    mockContext, 
    mockInvalidHttpMethodEvent, 
    mockResolvedValueSuccess, 
    mockValidEvent 
} from './__mocks__/getRecipeImagePresignedUrl.mock';

describe("execute getRecipeImagePresignedUrl lambda function", () => {
    
    afterEach((done) => {
        jest.clearAllMocks();
        jest.resetAllMocks();
        done();
    });
    it("should return presigned url", async () => {
        jest.mock("../../../src/recipe/get-recipe-image-presigned-url/index", async () => ({
            getSignedUrl: jest.fn().mockResolvedValueOnce(mockResolvedValueSuccess)
        }));
        process.env.RECIPE_BUCKET = "somesamplebucket";
        const res = await handler(mockValidEvent, mockContext);
        expect(res.statusCode).toEqual(200);
        const resBody = JSON.parse(res.body);
        expect(Object.keys(resBody)).toContain("signedUrl");
        expect(Object.keys(resBody)).toContain("filename");
    });
    it("should fail given invalid HTTP method", async () => {
        const res = await handler(mockInvalidHttpMethodEvent, mockContext);
        expect(res.statusCode).toEqual(405);
    })
})