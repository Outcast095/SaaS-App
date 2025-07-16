"use client";

// Указывает, что это клиентский компонент в Next.js, то есть код выполняется на стороне клиента и может использовать браузерные API, такие как DOM или хуки React.

import { zodResolver } from "@hookform/resolvers/zod"; // Импорт резолвера для интеграции валидации Zod с React Hook Form
import { useForm } from "react-hook-form"; // Хук React Hook Form для управления состоянием формы и валидацией
import { z } from "zod"; // Библиотека Zod для создания схем валидации
import { Button } from "@/components/ui/button"; // Пользовательский компонент Button из UI-библиотеки (вероятно, Shadcn/UI)
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"; // Компоненты формы из UI-библиотеки для структурированного отображения формы
import { Input } from "@/components/ui/input"; // Пользовательский компонент Input
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"; // Пользовательские компоненты Select для выпадающих списков
import { subjects } from "@/constants"; // Массив строк с предметами (предположительно список опций)
import { Textarea } from "@/components/ui/textarea"; // Пользовательский компонент Textarea
import { createCompanion } from "@/lib/actions/companion.actions"; // Серверное действие для создания компаньона
import { redirect } from "next/navigation"; // Функция Next.js для программной навигации

// Определение схемы формы с помощью Zod
// Схема задаёт правила валидации для каждого поля формы
const formSchema = z.object({
    name: z.string().min(1, { message: "Имя компаньона обязательно." }), // Строка, не должна быть пустой
    subject: z.string().min(1, { message: "Предмет обязателен." }), // Строка, не должна быть пустой
    topic: z.string().min(1, { message: "Тема обязательна." }), // Строка, не должна быть пустой
    voice: z.string().min(1, { message: "Голос обязателен." }), // Строка, не должна быть пустой
    style: z.string().min(1, { message: "Стиль обязателен." }), // Строка, не должна быть пустой
    duration: z.coerce.number().min(1, { message: "Продолжительность обязательна." }), // Число, преобразованное из строки, минимум 1
});

// Компонент формы для создания компаньона
const CompanionForm = () => {
    // Инициализация формы с помощью хука useForm
    // z.infer извлекает TypeScript-тип из схемы Zod
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema), // Подключаем Zod для валидации
        defaultValues: {
            name: "", // Начальное значение для имени
            subject: "", // Начальное значение для предмета
            topic: "", // Начальное значение для темы
            voice: "", // Начальное значение для голоса
            style: "", // Начальное значение для стиля
            duration: 15, // Начальное значение для продолжительности (в минутах)
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        const companion = await createCompanion(values);

        if(companion) {
            redirect(`/companions/${companion.id}`);
        } else {
            console.log('Failed to create a companion');
            redirect('/');
        }
    }

    // JSX для рендеринга формы
    return (
        <Form {...form}>
            {/* Подключаем обработчик отправки формы через handleSubmit */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Поле для имени компаньона */}
                <FormField
                    control={form.control} // Управление состоянием поля через React Hook Form
                    name="name" // Имя поля, соответствует ключу в схеме
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Имя компаньона</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Введите имя компаньона"
                                    {...field} // Передаём свойства поля (value, onChange и т.д.)
                                    className="input"
                                />
                            </FormControl>
                            <FormMessage /> {/* Отображение ошибок валидации */}
                        </FormItem>
                    )}
                />
                {/* Поле для выбора предмета */}
                <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Предмет</FormLabel>
                            <FormControl>
                                <Select
                                    onValueChange={field.onChange} // Обработчик изменения значения
                                    value={field.value} // Текущее значение поля
                                    defaultValue={field.value} // Начальное значение
                                >
                                    <SelectTrigger className="input capitalize">
                                        <SelectValue placeholder="Выберите предмет" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* Маппинг массива предметов для создания опций */}
                                        {subjects.map((subject) => (
                                            <SelectItem
                                                value={subject}
                                                key={subject}
                                                className="capitalize"
                                            >
                                                {subject}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {/* Поле для темы */}
                <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>С чем должен помочь компаньон?</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Например, производные и интегралы"
                                    {...field}
                                    className="input"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {/* Поле для выбора голоса */}
                <FormField
                    control={form.control}
                    name="voice"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Голос</FormLabel>
                            <FormControl>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    defaultValue={field.value}
                                >
                                    <SelectTrigger className="input">
                                        <SelectValue placeholder="Выберите голос" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Мужской</SelectItem>
                                        <SelectItem value="female">Женский</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {/* Поле для выбора стиля */}
                <FormField
                    control={form.control}
                    name="style"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Стиль</FormLabel>
                            <FormControl>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    defaultValue={field.value}
                                >
                                    <SelectTrigger className="input">
                                        <SelectValue placeholder="Выберите стиль" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="formal">Формальный</SelectItem>
                                        <SelectItem value="casual">Неформальный</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {/* Поле для продолжительности */}
                <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ожидаемая продолжительность сессии в минутах</FormLabel>
                            <FormControl>
                                <Input
                                    type="number" // Тип поля — число
                                    placeholder="15"
                                    {...field}
                                    className="input"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {/* Кнопка отправки формы */}
                <Button type="submit" className="w-full cursor-pointer">
                    Создать компаньона
                </Button>
            </form>
        </Form>
    );
};

export default CompanionForm; // Экспорт компонента
