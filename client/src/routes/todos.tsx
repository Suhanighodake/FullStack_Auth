import { createFileRoute, useRouter } from '@tanstack/react-router'
import { hc } from 'hono/client'
import type { AppType } from '../../../server'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleX, Plus } from 'lucide-react'
import { authClient } from '../lib/auth-client'
import { useEffect, useState } from 'react'

type Todo = {
  id: string
  userId: string
  title: string
  description: string | null
  completed: boolean
  createdAt: string
  updatedAt: string
}

const client = hc<AppType>('/')

export const Route = createFileRoute('/todos')({
  component: RouteComponent,
})

function RouteComponent() {
  const queryClient = useQueryClient()
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && !session) {
      router.navigate({ to: '/signin' })
    }
  }, [isPending, session, router])

  const { data, isError, error, isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const resp = await client.api.todos.$get()
      if (!resp.ok) throw new Error('Failed to fetch todos')
      return resp.json()
    },
    enabled: !!session && !isPending,
  })

  const createTodo = useMutation({
    mutationFn: async (values: { title: string; description?: string }) => {
      const resp = await client.api.todos.$post({ json: values })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Failed to create todo' }))
        throw new Error('error' in err ? err.error : 'Failed to create todo')
      }
      return resp.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  const updateTodo = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const resp = await client.api.todos[':id'].$patch({
        param: { id },
        json: { completed },
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Failed to update todo' }))
        throw new Error('error' in err ? err.error : 'Failed to update todo')
      }
      return resp.json()
    },
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      const previousTodos = queryClient.getQueryData<Todo[]>(['todos'])
      queryClient.setQueryData(['todos'], (old: Todo[] | undefined) =>
        old?.map((t) => (t.id === id ? { ...t, completed } : t))
      )
      return { previousTodos }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  if (isPending || !session) {
    return (
      <div className='flex flex-col items-center p-10'>
        <div className='w-full max-w-md space-y-3 p-6'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='flex items-center gap-2'>
              <div className='skeleton h-6 w-6 rounded-full'></div>
              <div className='skeleton h-4 w-32'></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col items-center p-10'>
      {isError && (
        <div role='alert' className='alert alert-error mb-4 w-full max-w-md'>
          <CircleX />
          <span>Error: {error.message}</span>
        </div>
      )}

      <div className='w-full max-w-md space-y-4 p-6'>
        <CreateTodoForm onSubmit={(values) => createTodo.mutate(values)} isPending={createTodo.isPending} />

        {isLoading && (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className='flex items-center gap-2'>
                <div className='skeleton h-6 w-6 rounded-full'></div>
                <div className='skeleton h-4 w-32'></div>
              </div>
            ))}
          </>
        )}

        {!isLoading && data && data.length === 0 && (
          <div className='text-center text-base-content/60 py-8'>
            No todos yet. Create your first one above.
          </div>
        )}

        {!isLoading &&
          data &&
          data.map((todo) => (
            <div key={todo.id} className='flex items-center gap-2 rounded-lg border border-base-300 p-3'>
              <input
                type='checkbox'
                className='checkbox checkbox-primary'
                checked={todo.completed}
                onChange={(e) => updateTodo.mutate({ id: todo.id, completed: e.target.checked })}
                disabled={updateTodo.isPending}
              />
              <div className='flex flex-col'>
                <span className={todo.completed ? 'line-through opacity-60' : ''}>{todo.title}</span>
                {todo.description && (
                  <span className='text-sm text-base-content/60'>{todo.description}</span>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

function CreateTodoForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (values: { title: string; description?: string }) => void
  isPending: boolean
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onSubmit({ title: trimmed, description: description.trim() || undefined })
    setTitle('')
    setDescription('')
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-3'>
      <div className='join w-full'>
        <input
          type='text'
          placeholder='What needs to be done?'
          className='input input-bordered join-item w-full text-lg h-14 px-5'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPending}
          required
        />
        <button
          type='submit'
          className='btn btn-primary join-item h-14 px-6 text-lg'
          disabled={isPending || !title.trim()}
        >
          {isPending ? (
            <span className='loading loading-spinner loading-sm'></span>
          ) : (
            <Plus className='size-5' />
          )}
          <span className='hidden sm:inline'>Add</span>
        </button>
      </div>
      <input
        type='text'
        placeholder='Description (optional)'
        className='input input-bordered w-full text-lg h-12 px-5'
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={isPending}
      />
    </form>
  )
}
