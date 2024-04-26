"use client"

import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import { useMutation, useQuery } from "convex/react"

const ConvexTest = () => {
  const tasks = useQuery(api.tasks.getTasks)
  const deleteTask = useMutation(api.tasks.deleteTask)

  return (
    <div className="flex flex-col gap-4 p-10">
      <h1 className="text-5xl">All tasks are real time</h1>

      {tasks?.map((task) => (
        <div className="flex items-center gap-2" key={task._id}>
          <span>{task.text}</span>
          <Button
            onClick={async () => {
              await deleteTask({ id: task._id })
            }}
          >
            Delete Task
          </Button>
        </div>
      ))}
    </div>
  )
}

export default ConvexTest
