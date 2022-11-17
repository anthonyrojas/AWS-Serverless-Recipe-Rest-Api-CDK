import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { 
    Table,
    AttributeType
} from 'aws-cdk-lib/aws-dynamodb';
export class DatabaseStack extends cdk.Stack {
    public readonly RecipesTable: Table;

    constructor(scope: Construct, id: string, props?:cdk.StageProps) {
        super(scope, id, props);
        const recipesTable = new Table(this, 'RecipesApiTable', {
            //tableName: 'Recipes',
            partitionKey: {
            name: "recipeId",
            type: AttributeType.STRING
            },
            sortKey: {
                name: "itemId", //will contain userId and unique id of ingredient and instructions
                type: AttributeType.STRING
            },
            readCapacity: 10,
            writeCapacity: 10
        });
        recipesTable.addGlobalSecondaryIndex({
            indexName: "UserItemIndex",
            partitionKey: {
                name: "userId",
                type: AttributeType.STRING
            },
            sortKey: {
                name: "itemId",
                type: AttributeType.STRING
            }
        });
        this.RecipesTable = recipesTable;
    }
}