//компонент необходимо создать в папке под названием [[...sign-in]]
//данный компонент скопирован из библиотеки clerk
import { SignIn } from '@clerk/nextjs';

// Определяем компонент Page как экспортируемый по умолчанию
export default function Page() {
    // Компонент возвращает JSX для отображения страницы входа
    return (
        // Главный контейнер с Tailwind CSS классами для центрирования содержимого
        // flex: задает flexbox-контейнер
        // items-center: центрирует содержимое по вертикали
        // justify-center: центрирует содержимое по горизонтали
        <main className="flex items-center justify-center">
            {/* Компонент SignIn отображает готовую форму входа, предоставляемую Clerk */}
            <SignIn />
        </main>
    );
}