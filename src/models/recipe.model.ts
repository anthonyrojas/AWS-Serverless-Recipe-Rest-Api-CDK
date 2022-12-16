import {v4 as uuid} from "uuid";
import {Ingredient, IIngredient} from "./ingredient.model";
import {Instruction, IInstruction} from "./instruction.model";
const ENTITY_TYPE = "RECIPE";
export interface IRecipe {
    recipeId?: string;
    itemId?: string; //same as recipeId
    userId: string;
    entityType?: string;
    name: string;
    description: string;
    cookTime: Number;
    prepTime: Number;
    ingredients?: IIngredient[];
    instructions?: IInstruction[];
    imageUrls?: string[];
    searchName?: string;
}
export class Recipe implements IRecipe {
    recipeId: string;
    itemId: string; //same as recipeId
    userId: string;
    entityType: string;
    name: string;
    description: string;
    cookTime: Number;
    prepTime: Number;
    ingredients: Ingredient[];
    instructions: Instruction[];
    imageUrls: string[];
    searchName: string;
    constructor(userId: string, pName: string, pDescription: string, pCookTime: Number, pPrepTime: Number, pId?: string, pImageUrls?: string[]) {
        if (pId === undefined || pId === null) this.recipeId = uuid();
        else this.recipeId = pId;
        this.itemId = this.recipeId;
        this.userId = userId;
        this.name = pName.trim();
        this.searchName = pName.toLowerCase().trim();
        this.description = pDescription.trim();
        this.cookTime = pCookTime;
        this.prepTime = pPrepTime;
        this.ingredients = [];
        this.instructions = [];
        this.entityType = ENTITY_TYPE;
        if (pImageUrls) this.imageUrls = pImageUrls;
        else this.imageUrls = [];
    }
    attachIIngredients(iIngredients: IIngredient[]) {
        this.ingredients = iIngredients.map(iIngredient => {
            return new Ingredient(this.recipeId, this.userId, iIngredient.name, iIngredient.quantity, iIngredient.units);
        });
    }
    attachIInstructions(iInstructions: IInstruction[]) {
        this.instructions = iInstructions.map(iInstruction => {
            return new Instruction(this.recipeId, this.userId, iInstruction.step, iInstruction.order);
        })
        //this.instructions = new Instructions(this.recipeId, iInstructions.steps);
    }
    toPutRequestItem() {
        return {
            recipeId: this.recipeId,
            userId: this.userId,
            itemId: this.itemId,
            entityType: this.entityType,
            name: this.name,
            description: this.description,
            cookTime: this.cookTime,
            prepTime: this.prepTime,
            imageUrls: this.imageUrls,
            searchName: this.searchName
        }
    }
}