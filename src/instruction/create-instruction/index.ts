import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import {
    QueryCommand,
    QueryCommandInput,
    QueryCommandOutput,
    BatchWriteItemCommandInput,
    BatchWriteItemCommandOutput,
    BatchWriteItemCommand,
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
        if (queryCmdOutput.Items === undefined || !queryCmdOutput.Count || queryCmdOutput.Count === 0) {
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
        console.log(`Adding a new instruction to recipe with ${queryCmdOutput.Count} instructions`);
        let newInstructionOrder = Number(eventBody.order);
        //decide final order
        if(newInstructionOrder < 1) newInstructionOrder = 1;
        else if(newInstructionOrder > queryCmdOutput.Count!) newInstructionOrder = queryCmdOutput.Count+1;
        const newInstruction = new Instruction(
            recipeId,
            userId,
            eventBody.step,
            newInstructionOrder
        );
        if (newInstruction.order > queryCmdOutput.Count) {
            const putItemCmdInput: PutItemCommandInput = {
                TableName: recipeTableName,
                Item: marshall(newInstruction.toPutRequestItem())
            };
            const putItemCmd = new PutItemCommand(putItemCmdInput);
            await ddbClient.send(putItemCmd);
        } else {
            const instructions = queryCmdOutput.Items!.map(item => {
                return new Instruction(
                    recipeId, 
                    userId, 
                    item["step"].toString(), 
                    Number(item["order"]),
                    item["itemId"].toString()
                );
            }).sort((a, b) => a.order - b.order);
            const putItems = instructions.map((instruction, i) => {
                if (instruction.order === newInstruction.order) {
                    instructions[i].order += 1;
                } else if(i > 0 && instructions[i-1] === newInstruction) {
                    instructions[i].order += 1;
                }
                return {
                    PutRequest: {
                        Item: marshall(instructions[i].toPutRequestItem())
                    }
                };
            });
            const batchWriteInput: BatchWriteItemCommandInput = {
                RequestItems: {
                    [recipeTableName]: [
                        ...putItems,
                        {
                            PutRequest: {
                                Item: marshall(newInstruction.toPutRequestItem())
                            }
                        }
                    ]
                }
            };
            const batchWriteCmd = new BatchWriteItemCommand(batchWriteInput);
            await ddbClient.send(batchWriteCmd);
        }
        return {
            statusCode: 200,
            body: JSON.stringify({
                instruction: newInstruction.toPutRequestItem()
            })
        };
    } catch (error) {
        console.error(error);
        console.error((error as Error).message)
        return {
            statusCode: 200,
            message: (error as Error).message
        }   
    }
}