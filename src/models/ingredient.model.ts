import {v4 as uuid} from 'uuid';
const ENTITY_TYPE = "INGREDIENT";
export interface IIngredient {
    itemId?: string;
    recipeId?: string;
    entityType?: string;
    title: string;
    quantity: Number;
    units: string;
    userId?: string;
}
export class Ingredient implements IIngredient {
    itemId: string;
    userId: string;
    title: string;
    entityType: string;
    quantity: Number;
    units: string;
    recipeId: string;
    constructor( pRecipeId: string, pUserId: string, pTitle: string, pQuantity: Number, pUnits: string, pId: string|null = null) {
        if (pId === null) this.itemId = uuid();
        else this.itemId = pId;
        this.userId = pUserId;
        this.title = pTitle.trim();
        this.quantity = pQuantity;
        this.units = pUnits.trim();
        this.recipeId = pRecipeId;
        this.entityType = ENTITY_TYPE
    }
    toPutRequestItem() {
        return {
            recipeId: this.recipeId,
            userId: this.userId,
            itemId: this.itemId,
            entityType: this.entityType,
            title: this.title,
            units: this.units,
            quantity: this.quantity
        }
    }
}