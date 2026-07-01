import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import { todos } from "./schema";

export const getTodosByUserId = async (userId: string) => {
    return await db
        .select().from(todos)
        .where(eq(todos.userId, userId))
        .orderBy(desc(todos.createdAt))
}

export const createTodo = async (userId: string, title: string, description?: string) => {
    const [todo] = await db
        .insert(todos)
        .values({
            userId,
            title,
            description: description ?? null,
        })
        .returning()

    return todo
}

export const updateTodo = async (todoId: string, userId: string, values: { title?: string; description?: string | null; completed?: boolean }) => {
    const [todo] = await db
        .update(todos)
        .set({
            ...values,
            updatedAt: new Date(),
        })
        .where(eq(todos.id, todoId))
        .returning()

    if (!todo || todo.userId !== userId) {
        return null
    }

    return todo
}