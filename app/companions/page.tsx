// Импортируем функцию для получения данных из Supabase и компоненты
import { getAllCompanions } from "@/lib/actions/companion.actions";
import CompanionCard from "@/components/CompanionCard";
import { getSubjectColor } from "@/lib/utils";
import SearchInput from "@/components/SearchInput";
import SubjectFilter from "@/components/SubjectFilter";

// Компонент принимает searchParams (параметры URL, например, ?subject=math&topic=algebra)
const CompanionsLibrary = async ({ searchParams }: SearchParams) => {
    // Получаем параметры поиска (subject и topic) из searchParams
    const filters = await searchParams;
    const subject = filters.subject ? filters.subject : ''; // Если subject есть, используем его, иначе пустая строка
    const topic = filters.topic ? filters.topic : '';     // То же для topic

    // Вызываем функцию getAllCompanions с фильтрами subject и topic
    const companions = await getAllCompanions({ subject, topic });

    // Рендерим JSX
    return (
        <main>
            <section className="flex justify-between gap-4 max-sm:flex-col">
                <h1>Companion Library</h1>
                <div className="flex gap-4">
                     <SearchInput />  {/* Компонент для ввода поискового запроса */}
                    <SubjectFilter />   {/* Компонент для фильтрации по предмету */}
                </div>
            </section>
            <section className="companions-grid">
                {/* Маппим массив companions на компоненты CompanionCard */}
                {companions.map((companion) => (
                    <CompanionCard
                        key={companion.id} // Уникальный ключ для React
                        {...companion} // Распаковываем все поля объекта companion (id, name, subject, topic и т.д.)
                        color={getSubjectColor(companion.subject)} // Передаем цвет, вычисленный на основе subject
                    />
                ))}
            </section>
        </main>
    );
};

// Экспортируем компонент
export default CompanionsLibrary;