import { Hono } from "hono";
import { createTodo, getTodosByUserId, updateTodo } from "../db/queries";
import { authMiddleware } from "../middlewares/auth.middleware";
import { HonoEnv } from "../types";

export const todos = new Hono<HonoEnv>()

    .use(authMiddleware)

    .get('/', async (c) => {
        const user = c.get('user');
        try {
            const todos = await getTodosByUserId(user.id)
            return c.json(todos)
        }
        catch (error) {
            console.error('Failed to fetch todos:', error)
            return c.json({ error: 'Failed to fetch todos' }, 500)
        }
    })

    .post('/', async (c) => {
        const user = c.get('user');
        const body = await c.req.json<{ title?: string; description?: string }>()

        const title = body.title?.trim()
        if (!title) {
            return c.json({ error: 'Title is required' }, 400)
        }

        try {
            const todo = await createTodo(user.id, title, body.description)
            return c.json(todo, 201)
        } catch (error) {
            console.error('Failed to create todo:', error)
            return c.json({ error: 'Failed to create todo' }, 500)
        }
    })

    .patch('/:id', async (c) => {
        const user = c.get('user');
        const todoId = c.req.param('id')
        const body = await c.req.json<{ completed?: boolean; title?: string; description?: string | null }>()

        if (body.completed === undefined && body.title === undefined && body.description === undefined) {
            return c.json({ error: 'Nothing to update' }, 400)
        }

        try {
            const todo = await updateTodo(todoId, user.id, body)
            if (!todo) {
                return c.json({ error: 'Todo not found' }, 404)
            }
            return c.json(todo)
        } catch (error) {
            console.error('Failed to update todo:', error)
            return c.json({ error: 'Failed to update todo' }, 500)
        }
    })