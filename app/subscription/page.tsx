// Импортируем компонент PricingTable из библиотеки Clerk для Next.js
// Этот компонент предоставляет готовую таблицу с информацией о тарифных планах подписки
import { PricingTable } from '@clerk/nextjs';

// Определяем функциональный компонент Subscription
const Subscription = () => {
    // Компонент возвращает JSX, который рендерит таблицу цен
    return (
        // Оборачиваем PricingTable в div для базовой компоновки
        <div>
            {/* Компонент PricingTable отображает таблицу с тарифными планами, настроенными в Clerk */}
            <PricingTable />
        </div>
    );
};

// Экспортируем компонент Subscription как компонент по умолчанию
export default Subscription;