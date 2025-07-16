// Импортируем компоненты аккордеона из кастомной библиотеки UI
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

// Импортируем функцию currentUser для получения данных текущего пользователя из Clerk
import { currentUser } from "@clerk/nextjs/server";

// Импортируем функцию redirect для перенаправления пользователя
import { redirect } from "next/navigation";

// Импортируем функции для получения данных о компаньонах пользователя, истории сессий и избранных компаньонов
import {
    getUserCompanions,
    getUserSessions,
} from "@/lib/actions/companion.actions";

// Импортируем компонент Image из Next.js для отображения изображений
import Image from "next/image";

// Импортируем кастомный компонент CompanionsList для отображения списка компаньонов
import CompanionsList from "@/components/CompanionsList";










// страница My Journey
const Profile = async () => {
    // Получаем данные текущего пользователя через Clerk
    const user = await currentUser();

    // Если пользователь не аутентифицирован (user === null), перенаправляем на страницу входа
    if (!user) redirect("/sign-in");

    // Запрашиваем данные о компаньонах, созданных пользователем, его истории сессий и избранных компаньонах
    // Передаем user.id в качестве аргумента для фильтрации данных по конкретному пользователю
    const companions = await getUserCompanions(user.id);
    const sessionHistory = await getUserSessions(user.id);

    // Возвращаем JSX для отображения страницы профиля
    return (
        <main className="min-lg:w-3/4">
            {/* Секция с информацией о пользователе и статистикой */}
            <section className="flex justify-between gap-4 max-sm:flex-col items-center">
                {/* Блок с аватаром и данными пользователя */}
                <div className="flex gap-4 items-center">
                    {/* Отображаем аватар пользователя */}
                    <Image
                        src={user.imageUrl} // URL аватара пользователя из Clerk
                        alt={user.firstName!} // Альтернативный текст (имя пользователя)
                        width={110}
                        height={110}
                    />
                    <div className="flex flex-col gap-2">
                        {/* Отображаем имя и фамилию пользователя */}
                        <h1 className="font-bold text-2xl">
                            {user.firstName} {user.lastName}
                        </h1>
                        {/* Отображаем email пользователя с приглушенным стилем */}
                        <p className="text-sm text-muted-foreground">
                            {user.emailAddresses[0].emailAddress}
                        </p>
                    </div>
                </div>
                {/* Блок со статистикой пользователя */}
                <div className="flex gap-4">
                    {/* Блок с количеством завершенных уроков */}
                    <div className="border border-black rouded-lg p-3 gap-2 flex flex-col h-fit">
                        <div className="flex gap-2 items-center">
                            <Image
                                src="/icons/check.svg" // Иконка галочки
                                alt="checkmark"
                                width={22}
                                height={22}
                            />
                            {/* Количество завершенных сессий */}
                            <p className="text-2xl font-bold">{sessionHistory.length}</p>
                        </div>
                        <div>Lessons completed</div>
                    </div>
                    {/* Блок с количеством созданных компаньонов */}
                    <div className="border border-black rouded-lg p-3 gap-2 flex flex-col h-fit">
                        <div className="flex gap-2 items-center">
                            <Image src="/icons/cap.svg" alt="cap" width={22} height={22} />
                            {/* Количество созданных компаньонов */}
                            <p className="text-2xl font-bold">{companions.length}</p>
                        </div>
                        <div>Companions created</div>
                    </div>
                </div>
            </section>
            {/* Аккордеон для отображения списков компаньонов и сессий */}
            <Accordion type="multiple">
                {/* Элемент аккордеона для недавних сессий */}
                <AccordionItem value="recent">
                    <AccordionTrigger className="text-2xl font-bold">
                        Recent Sessions
                    </AccordionTrigger>
                    <AccordionContent>
                        {/* Компонент для отображения списка компаньонов из недавних сессий */}
                        <CompanionsList
                            title="Recent Sessions"
                            companions={sessionHistory}
                        />
                    </AccordionContent>
                </AccordionItem>
                {/* Элемент аккордеона для созданных компаньонов */}
                <AccordionItem value="companions">
                    <AccordionTrigger className="text-2xl font-bold">
                        My Companions {`(${companions.length})`}
                    </AccordionTrigger>
                    <AccordionContent>
                        {/* Компонент для отображения списка созданных компаньонов */}
                        <CompanionsList title="My Companions" companions={companions} />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </main>
    );
};

// Экспортируем компонент Profile как компонент по умолчанию
export default Profile;