import { Toaster as Sonner } from "sonner"

// Figma "confirmation-toast": black pill, white Geist Medium 14/24, top center.
const Toaster = (props) => {
  return (
    <Sonner
      position="top-center"
      offset={16}
      gap={8}
      duration={3000}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "inset-x-0 mx-auto flex w-fit max-w-[90vw] items-center gap-2 rounded-full bg-black px-4 py-2 text-sm leading-6 font-medium text-white shadow-lg",
          error: "bg-destructive",
          icon: "hidden",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
