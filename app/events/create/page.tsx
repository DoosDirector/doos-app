import type { Metadata } from "next"
import { CreateEventForm } from "./_components/create-event-form"

export const metadata: Metadata = {
  title: "Create a Doo",
}

export default function CreateEventPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create a Doo</h1>
        <p className="text-sm text-muted-foreground">
          Fill in the details to organise your team event.
        </p>
      </div>
      <CreateEventForm />
    </div>
  )
}
