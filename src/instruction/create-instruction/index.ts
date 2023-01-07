import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import {
    QueryCommand,
    QueryCommandInput,
    QueryCommandOutput,
    BatchWriteItemCommandInput,
    BatchWriteItemCommand,
    PutItemCommandInput,
    PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { IInstruction, Instruction } from '../../models/instruction.model';
import { ddbClient } from '../../utils/DynamoDBClient';
import { headers } from '../../utils/Headers';
export async function handler(event: APIGatewayEvent, context: Context) {
    let statusCode = 200;
    try {
        if (event.httpMethod !== 'POST') {
            statusCode = 405;
            throw new Error(`${event.httpMethod} HTTP method is not supported in ${context.functionName}`);
        }
        const recipeTableName: string = process.env.RECIPES_TABLE_NAME!;
        if (!event.pathParameters || event.pathParameters === null || !event.pathParameters["recipeId"]) {
            statusCode = 404;
            throw new Error('Request is missing parameters or body.');
        }
        const recipeId: string = event.pathParameters["recipeId"];
        if(!event.requestContext || event.requestContext === null || !event.requestContext.authorizer || event.requestContext.authorizer === null || !event.requestContext.authorizer.claims["cognito:username"]) {
            statusCode = 403;
            throw new Error("Unauthenticated!");
        }
        const userId: string = event.requestContext.authorizer.claims["cognito:username"];
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
        const eventBody: IInstruction = JSON.parse(event.body!);
        if (!queryCmdOutput.Items || !queryCmdOutput.Count || queryCmdOutput.Count === 0) {
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
                headers: headers,
                body: JSON.stringify({
                    instruction: instruction.toPutRequestItem()
                })
            }
        }
        console.log(`Adding a new instruction to recipe with ${queryCmdOutput.Count} instructions`);
        let newInstructionOrder = Number(eventBody.order);
        //decide final order
        if(newInstructionOrder < 1) newInstructionOrder = 1;
        else if(newInstructionOrder > queryCmdOutput.Count!) newInstructionOrder = queryCmdOutput.Count!+1;
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
                const unmarshalledItem = unmarshall(item);
                return new Instruction(
                    recipeId, 
                    userId, 
                    unmarshalledItem.step, 
                    Number(unmarshalledItem.order),
                    unmarshalledItem.itemId
                );
            }).sort((a, b) => a.order - b.order);
            const putItems = instructions.map((instruction, i) => {
                if (instruction.order === newInstruction.order) {
                    instructions[i].order += 1;
                } else if(i > 0 && instructions[i-1].order === newInstruction.order) {
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
        ddbClient.destroy();
        return {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify({
                instruction: newInstruction.toPutRequestItem()
            })
        };
    } catch (error) {
        const e = error as Error;
        console.error(e.message)
        return {
            statusCode: statusCode < 400 ? 400 : statusCode,
            headers: headers,
            body: JSON.stringify({
                message: e.message
            })
        }   
    }
}