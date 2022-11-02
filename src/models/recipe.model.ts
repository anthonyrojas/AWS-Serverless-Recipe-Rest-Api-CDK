import {v4 as uuid} from "uuid";
import {Ingredient, IIngredient} from "./ingredient.model";
import {Instruction, IInstruction} from "./instruction.model";
const ENTITY_TYPE = "RECIPE";
export interface IRecipe {
    recipeId?: string;
    itemId?: string; //userId
    entityType?: string;
    name: string;
    description: string;
    cookTime: Number;
    prepTime: Number;
    ingredients?: IIngredient[];
    instructions?: IInstruction[];
}
export class Recipe implements IRecipe {
    recipeId: string;
    itemId: string; //userId
    entityType: string;
    name: string;
    description: string;
    cookTime: Number;
    prepTime: Number;
    ingredients: Ingredient[];
    instructions: Instruction[];
    constructor(userId: string, pName: string, pDescription: string, pCookTime: Number, pPrepTime: Number, pId?: string) {
        if (pId === undefined || pId === null) this.recipeId = uuid();
        else this.recipeId = pId;
        this.itemId = userId;
        this.name = pName.trim();
        this.description = pDescription.trim();
        this.cookTime = pCookTime;
        this.prepTime = pPrepTime;
        this.ingredients = [];
        this.instructions = [];
        this.entityType = ENTITY_TYPE;
    }
    attachIIngredients(iIngredients: IIngredient[]) {
        this.ingredients = iIngredients.map(iIngredient => {
            return new Ingredient(this.recipeId, iIngredient.name, iIngredient.quantity, iIngredient.units);
        });
    }
    attachIInstructions(iInstructions: IInstruction[]) {
        this.instructions = iInstructions.map(iInstruction => {
            return new Instruction(this.recipeId, iInstruction.step, iInstruction.order);
        })
        //this.instructions = new Instructions(this.recipeId, iInstructions.steps);
    }
    toPutRequestItem() {
        return {
            recipeId: this.recipeId,
            itemId: this.itemId,
            entityType: this.entityType,
            name: this.name,
            description: this.description,
            cookTime: this.cookTime,
            prepTime: this.prepTime
        }
    }
}