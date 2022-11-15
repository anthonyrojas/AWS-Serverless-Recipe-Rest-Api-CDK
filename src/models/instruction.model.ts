import {v4 as uuid} from 'uuid';
const ENTITY_TYPE = "INSTRUCTION";
export interface IInstruction {
    itemId?: string;
    recipeId?: string;
    entityType?: string;
    order: number;
    step: string;
    userId?: string;
}
export class Instruction implements IInstruction {
    itemId: string;
    recipeId: string;
    userId: string;
    entityType: string;
    order: number;
    step: string;
    constructor(pRecipeId: string, pUserId: string, pStep: string, pOrder: number, pId: string|null = null) {
        if (pId === null) this.itemId = uuid();
        else this.itemId = pId;
        this.recipeId = pRecipeId;
        this.userId = pUserId;
        this.step = pStep.trim();
        this.order = pOrder;
        this.entityType = ENTITY_TYPE;
    }
    toPutRequestItem() {
        return {
            recipeId: this.recipeId,
            userId: this.userId,
            itemId: this.itemId,
            entityType: this.entityType,
            step: this.step,
            order: this.order
        }
    }
}