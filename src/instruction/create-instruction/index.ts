import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import {
    QueryCommand,
    QueryCommandInput,
    QueryCommandOutput,
    // BatchWriteItemCommandInput,
    // BatchWriteItemCommandOutput,
    // BatchWriteItemCommand,
    PutItemCommandInput,
    PutItemCommand,
    DynamoDBClient
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { IInstruction, Instruction } from '../../models/instruction.model';
export async function handler(event: APIGatewayEvent, context: Context) {
    let statusCode = 200;
    try {
        if (event.httpMethod !== 'POST') {
            statusCode = 405;
            throw new Error(`${event.httpMethod} HTTP method is not supported in ${context.functionName}`);
        }
        const recipeTableName: string = process.env.RECIPES_TABLE_NAME!;
        const ddbClient = new DynamoDBClient({
            region: 'us-west-2'
        });
        if (event.pathParameters === null || event.pathParameters["recipeId"] === undefined || event.pathParameters["recipeId"].trim() === "" || event.body === undefined || event.body === null) {
            statusCode = 400;
            throw new Error('Request is missing parameters or body.');
        }
        const recipeId: string = event.pathParameters["recipeId"];
        const userId = event.requestContext.authorizer!.claims["cognito:username"];
        const queryCmdInput: QueryCommandInput = {
            TableName: recipeTableName,
            ExpressionAttributeValues: {
                ":id": {
                    S: recipeId
                },
                ":entityType": {
                    S: "INSTRUCTION"
                },
                ":userId": {
                    S: userId
                }
            },
            KeyConditionExpression: 'recipeId = :id',
            FilterExpression: "entityType=:entityType AND userId=:userId"
        };
        const queryCmd = new QueryCommand(queryCmdInput);
        const queryCmdOutput: QueryCommandOutput = await ddbClient.send(queryCmd);
        const eventBody: IInstruction = JSON.parse(event.body);
        if (queryCmdOutput.Items === undefined) {
            console.log('Adding a new instruction for recipe without instructions');
            //add the instruction to the recipe as-is
            const instruction = new Instruction(
                recipeId,
                userId,
                eventBody.step,
                1
            );
            const putItemCmdInput: PutItemCommandInput = { 
                TableName: recipeTableName,
                Item: marshall(instruction.toPutRequestItem())
            };
            const putItemCmd = new PutItemCommand(putItemCmdInput);
            await ddbClient.send(putItemCmd);
            return {
                statusCode: 200,
                body: JSON.stringify({
                    instruction: instruction.toPutRequestItem()
                })
            }
        }
        let maxOrder = 0;
        queryCmdOutput.Items!.forEach(item => {
            const instruction: IInstruction = unmarshall(item) as IInstruction;
            maxOrder = Math.max(maxOrder, instruction.order);
        });
        console.log(`Adding a new instruction to recipe with ${maxOrder} instructions`);
        // const orders = queryCmdOutput.Items!.map(instruction => {
        //     const unmarshalled: IInstruction = unmarshall(instruction) as IInstruction;
        //     return unmarshalled;
        // }).sort((a, b) => (a.order > b.order) ? 1 : -1);
        // const order = orders[0].order + 1;
        const instruction = new Instruction(
            recipeId,
            userId,
            eventBody.step,
            maxOrder+1
        );
        console.log(instruction.toPutRequestItem());
        const putItemCmdInput: PutItemCommandInput = {
            TableName: recipeTableName,
            Item: marshall(instruction.toPutRequestItem())
        };
        const putItemCmd = new PutItemCommand(putItemCmdInput);
        await ddbClient.send(putItemCmd);
        return {
            statusCode: 200,
            body: JSON.stringify({
                instruction: instruction.toPutRequestItem()
            })
        }
        // const dbInstructions = queryCmdOutput.Items!.map(item => {
        //     const unmarshalled = unmarshall(item) as IInstruction;
        //     return {
        //         PutRequest: {
        //             Item: marshall(item)
        //         }
        //     }
        // });
        // const batchWriteCmdInput: BatchWriteItemCommandInput = {
        //     RequestItems: {
        //         [recipeTableName]: [
        //             {
        //                 PutRequest: {
        //                     Item: marshall(event.body)
        //                 }
        //             }
        //         ]
        //     }
        // }
    } catch (error) {
        console.error(error);
        console.error((error as Error).message)
        return {
            statusCode: 200,
            message: (error as Error).message
        }   
    }
}