"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
// import { users } from "@/dummy-data/db"
import { DialogClose } from "@radix-ui/react-dialog"
import { useMutation, useQuery } from "convex/react"
import { ImageIcon, MessageSquareDiff } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState, useTransition } from "react"
import toast from "react-hot-toast"
import { Button } from "../ui/button"
import { Input } from "../ui/input"

const UserListDialog = () => {
  const createConversation = useMutation(api.conversations.createConversation)
  const generateUploadUrl = useMutation(api.conversations.generateUploadUrl)
  const currentUser = useQuery(api.users.getCurrentUser)
  const users = useQuery(api.users.getUsers)

  const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([])
  const [groupName, setGroupName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [renderedImage, setRenderedImage] = useState("")
  const imgRef = useRef<HTMLInputElement>(null)
  const dialogCloseRef = useRef<HTMLButtonElement>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!selectedImage) return setRenderedImage("")
    const reader = new FileReader()
    reader.onload = (e) => setRenderedImage(e.target?.result as string)
  }, [selectedImage])

  const handleCreateConversation = () => {
    if (selectedUsers.length === 0) return
    startTransition(async () => {
      try {
        const isGroup = selectedUsers.length > 1
        let conversationId

        if (!isGroup) {
          conversationId = await createConversation({
            participants: [...selectedUsers, currentUser?._id!],
            isGroup: false,
          })
        } else {
          const postUrl = await generateUploadUrl()

          const result = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": selectedImage?.type! },
            body: selectedImage,
          })

          const { storageId } = await result.json()

          conversationId = await createConversation({
            participants: [...selectedUsers, currentUser?._id!],
            isGroup: true,
            admin: currentUser?._id!,
            groupName,
            groupImage: storageId,
          })
        }

        dialogCloseRef.current?.click()
        setSelectedUsers([])
        setGroupName("")
        setSelectedImage(null)

        // TODO => Update a global state called "selectedConversation"
      } catch (error) {
        toast.error("Failed to create conversation")
        console.error(error)
      }
    })
  }

  return (
    <Dialog>
      <DialogTrigger>
        <MessageSquareDiff size={20} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          {/* TODO: <DialogClose /> will be here */}
          <DialogClose ref={dialogCloseRef} />
          <DialogTitle>USERS</DialogTitle>
        </DialogHeader>

        <DialogDescription>Start a new chat</DialogDescription>
        {renderedImage && (
          <div className="w-16 h-16 relative mx-auto">
            <Image
              src={renderedImage}
              fill
              alt="user image"
              className="rounded-full object-cover"
            />
          </div>
        )}
        {/* TODO: input file */}
        <input
          type="file"
          accept="image/*"
          ref={imgRef}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              setSelectedImage(file)
              setRenderedImage(URL.createObjectURL(file))
            }
          }}
        />
        {selectedUsers.length > 1 && (
          <>
            <Input
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <Button
              className="flex gap-2"
              onClick={() => imgRef.current?.click()}
            >
              <ImageIcon size={20} />
              Group Image
            </Button>
          </>
        )}
        <div className="flex flex-col gap-3 overflow-auto max-h-60">
          {users?.map((user) => (
            <div
              key={user._id}
              className={`flex gap-3 items-center p-2 rounded cursor-pointer active:scale-95 
								transition-all ease-in-out duration-300
							${selectedUsers.includes(user._id) ? "bg-green-primary" : ""}`}
              onClick={() => {
                if (selectedUsers.includes(user._id)) {
                  setSelectedUsers(
                    selectedUsers.filter((id) => id !== user._id)
                  )
                } else {
                  setSelectedUsers([...selectedUsers, user._id])
                }
              }}
            >
              <Avatar className="overflow-visible">
                {user.isOnline && (
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-foreground" />
                )}

                <AvatarImage
                  src={user.image}
                  className="rounded-full object-cover"
                />
                <AvatarFallback>
                  <div className="animate-pulse bg-gray-tertiary w-full h-full rounded-full"></div>
                </AvatarFallback>
              </Avatar>

              <div className="w-full ">
                <div className="flex items-center justify-between">
                  <p className="text-md font-medium">
                    {user.name || user.email.split("@")[0]}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          <Button variant={"outline"}>Cancel</Button>
          <Button
            onClick={handleCreateConversation}
            disabled={
              selectedUsers.length === 0 ||
              (selectedUsers.length > 1 && !groupName) ||
              isPending
            }
          >
            {/* spinner */}
            {isPending ? (
              <div className="w-5 h-5 border-t-2 border-b-2  rounded-full animate-spin" />
            ) : (
              "Create"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
export default UserListDialog
