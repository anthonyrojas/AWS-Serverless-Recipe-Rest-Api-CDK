import {
    APIGatewayEvent,
    Context
} from 'aws-lambda';
import {
    PutItemCommand,
    PutItemCommandInput,
    BatchExecuteStatementCommand
} from '@aws-sdk/client-dynamodb';
import {
    marshall
} from '@aws-sdk/util-dynamodb';
import { IInstruction } from '../../models/instruction.model';
import {ddbClient} from '../../utils/DynamoDBClient';
import { headers } from '../../utils/Headers';

interface IInstructionOrder {
    itemId: string;
    order: number;
}

export async function handler(event: APIGatewayEvent, context: Context) {
    let statusCode = 200;
    try {
        if (event.httpMethod !== 'PUT') {
            statusCode = 405;
            throw new Error(`${event.httpMethod} HTTP method is not supported in ${context.functionName}`);
        }
        const recipeTableName: string = process.env.RECIPES_TABLE_NAME!;
        if (!event.pathParameters || event.pathParameters === null || !event.pathParameters["recipeId"]) {
            statusCode = 404;
            throw new Error("Missing parameters for a valid request.");
        }
        if (!event.requestContext || !event.requestContext.authorizer || !event.requestContext.authorizer.claims["cognito:username"]) {
            statusCode = 403;
            throw new Error("Unauthorized!");
        }
        const userId = event.requestContext.authorizer.claims["cognito:username"];
        const recipeId: string = event.pathParameters!["recipeId"]!;
        if (event.pathParameters["instructionId"] === undefined || event.pathParameters["instructionId"] === null) {
            //mass update instruction orders
            const eventBody = JSON.parse(event.body!);
            const instructionOrders: IInstructionOrder[] = eventBody["instructionOrders"];
            const statementItems = instructionOrders.map(instructionOrder => {
                return {
                    Statement: "UPDATE " + recipeTableName + " SET order=? WHERE recipeId=? AND itemId=? AND userId=?",
                    Parameters: [
                        {
                            N: instructionOrder.order.toString()
                        },
                        {
                            S: recipeId
                        },
                        {
                            S: instructionOrder.itemId
                        },
                        {
                            S: userId
                        }
                    ]
                }
            });
            const res = await ddbClient.send(new BatchExecuteStatementCommand({
                Statements: [...statementItems]
            }));
            ddbClient.destroy();
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify({
                    message: 'Updated instruction orders.',
                    updatedInstructionCount: res.Responses!.length || 0
                })
            }
        }
        const ingredientId: string = event.pathParameters!["instructionId"]!;
        const eventBody: IInstruction = JSON.parse(event.body!);
        const putItemCmdInput: PutItemCommandInput = {
            TableName: recipeTableName,
            Item: marshall(eventBody),
            ConditionExpression: "recipeId=:recipeId AND itemId=:itemId AND userId=:userId",
            ExpressionAttributeValues: {
                ":recipeId": {
                    S: recipeId
                },
                ":userId": {
                    S: userId
                },
                ":itemId": {
                    S: ingredientId
                }
            }
        };
        const putItemCmd = new PutItemCommand(putItemCmdInput);
        await ddbClient.send(putItemCmd);
        ddbClient.destroy();
        return {
            statusCode: 200, 
            headers: headers,
            body: JSON.stringify({
                instruction: eventBody
            })
        }
    } catch (error) {
        console.error((error as Error).message);
        return {
            statusCode: statusCode < 400 ? 400 : statusCode,
            headers: headers,
            body: JSON.stringify({
                message: (error as Error).message
            })
        }
    }
}