import {v4 as uuid} from 'uuid';
const ENTITY_TYPE = "INSTRUCTION";
export interface IInstruction {
    itemId?: string;
    recipeId?: string;
    entityType?: string;
    order: Number;
    step: string;
}
export class Instruction implements IInstruction {
    itemId: string;
    recipeId: string;
    entityType: string;
    order: Number;
    step: string;
    constructor(pRecipeId: string, pStep: string, pOrder: Number, pId: string|null = null) {
        if (pId === null) this.itemId = uuid();
        else this.itemId = pId;
        this.recipeId = pRecipeId;
        this.step = pStep.trim();
        this.order = pOrder;
        this.entityType = ENTITY_TYPE;
    }
    toPutRequestItem() {
        return {
            recipeId: this.recipeId,
            itemId: this.itemId,
            entityType: this.entityType,
            step: this.step,
            order: this.order
        }
    }
}