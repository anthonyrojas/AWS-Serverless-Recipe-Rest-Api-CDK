import {v4 as uuid} from 'uuid';
const ENTITY_TYPE = "INGREDIENT";
export interface IIngredient {
    itemId?: string;
    recipeId?: string;
    entityType?: string;
    name: string;
    quantity: Number;
    units: string;
}
export class Ingredient implements IIngredient {
    itemId: string;
    name: string;
    entityType: string;
    quantity: Number;
    units: string;
    recipeId: string;
    constructor( pRecipeId: string, pName: string, pQuantity: Number, pUnits: string, pId: string|null = null) {
        if (pId === null) this.itemId = uuid();
        else this.itemId = pId;
        this.name = pName.trim();
        this.quantity = pQuantity;
        this.units = pUnits.trim();
        this.recipeId = pRecipeId;
        this.entityType = ENTITY_TYPE
    }
    toPutRequestItem() {
        return {
            recipeId: this.recipeId,
            itemId: this.itemId,
            entityType: this.entityType,
            name: this.name,
            units: this.units,
            quantity: this.quantity
        }
    }
}