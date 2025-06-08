//компонент необходимо создать в папке под названием [[...sign-in]]
//данный компонент скопирован из библиотеки clerk
import { SignIn } from '@clerk/nextjs'

export default function Page() {
    return <main className="flex items-center justify-center">
        <SignIn />
    </main>
}