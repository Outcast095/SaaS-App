'use client'; // Указывает Next.js, что это клиентский компонент, выполняющийся на стороне клиента (не на сервере)

import { useEffect, useRef, useState } from 'react'; // Импорт хуков React для управления состоянием, эффектами и ссылками
import { cn, configureAssistant, getSubjectColor } from "@/lib/utils"; // Импорт утилит: cn для условных классов, configureAssistant для настройки ассистента, getSubjectColor для получения цвета по предмету
import { vapi } from "@/lib/vapi.sdk"; // Импорт SDK для работы с голосовым API (vapi)
import Image from "next/image"; // Компонент для оптимизированной загрузки изображений в Next.js
import Lottie, { LottieRefCurrentProps } from "lottie-react"; // Импорт Lottie для работы с анимациями
import soundwaves from '@/constants/soundwaves.json'; // JSON-файл с данными анимации звуковых волн
import { addToSessionHistory } from "@/lib/actions/companion.actions"; // Функция для добавления сессии в историю

// Перечисление (enum) для статусов звонка, чтобы четко определять текущее состояние
enum CallStatus {
    INACTIVE = 'INACTIVE', // Звонок не начат
    CONNECTING = 'CONNECTING', // Устанавливается соединение
    ACTIVE = 'ACTIVE', // Звонок активен
    FINISHED = 'FINISHED', // Звонок завершен
}

// Объявление компонента CompanionComponent, принимающего свойства (props)
const CompanionComponent = ({
                                companionId, // ID ассистента
                                subject, // Предмет разговора (например, математика, физика)
                                topic, // Тема разговора
                                name, // Имя ассистента
                                userName, // Имя пользователя
                                userImage, // URL изображения пользователя
                                style, // Стиль общения ассистента
                                voice // Голос ассистента
                            }: CompanionComponentProps) => {

    // Состояния компонента
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE); // Текущее состояние звонка, по умолчанию неактивно
    const [isSpeaking, setIsSpeaking] = useState(false); // Флаг, говорит ли ассистент (для анимации)
    const [isMuted, setIsMuted] = useState(false); // Флаг, выключен ли микрофон
    const [messages, setMessages] = useState<SavedMessage[]>([]); // Массив сообщений для отображения стенограммы

    // Ссылка на объект Lottie для управления анимацией звуковых волн
    const lottieRef = useRef<LottieRefCurrentProps>(null);

    // Хук useEffect для управления анимацией Lottie на основе состояния isSpeaking
    useEffect(() => {
        if (lottieRef.current) { // Проверяем, что ссылка на Lottie существует
            if (isSpeaking) {
                lottieRef.current.play(); // Если ассистент говорит, запускаем анимацию
            } else {
                lottieRef.current.stop(); // Если ассистент не говорит, останавливаем анимацию
            }
        }
    }, [isSpeaking, lottieRef]); // Зависимости: обновляется при изменении isSpeaking или lottieRef

    // Хук useEffect для подписки на события vapi SDK
    useEffect(() => {
        // Функция, вызываемая при старте звонка
        const onCallStart = () => setCallStatus(CallStatus.ACTIVE); // Устанавливаем статус ACTIVE

        // Функция, вызываемая при завершении звонка
        const onCallEnd = () => {
            setCallStatus(CallStatus.FINISHED); // Устанавливаем статус FINISHED
            addToSessionHistory(companionId); // Добавляем сессию в историю
        };

        // Функция для обработки сообщений от vapi
        const onMessage = (message: Message) => {
            // Обрабатываем только финальные транскрипты (не промежуточные)
            if (message.type === 'transcript' && message.transcriptType === 'final') {
                const newMessage = { role: message.role, content: message.transcript }; // Создаем объект сообщения
                setMessages((prev) => [newMessage, ...prev]); // Добавляем новое сообщение в начало массива
            }
        };

        // Функции для обработки начала и конца речи ассистента
        const onSpeechStart = () => setIsSpeaking(true); // Ассистент начал говорить
        const onSpeechEnd = () => setIsSpeaking(false); // Ассистент закончил говорить
        const onError = (error: Error) => console.log('Error', error); // Логирование ошибок

        // Подписка на события vapi
        vapi.on('call-start', onCallStart); // Событие начала звонка
        vapi.on('call-end', onCallEnd); // Событие окончания звонка
        vapi.on('message', onMessage); // Событие получения сообщения
        vapi.on('error', onError); // Событие ошибки
        vapi.on('speech-start', onSpeechStart); // Событие начала речи
        vapi.on('speech-end', onSpeechEnd); // Событие окончания речи

        // Очистка подписок при размонтировании компонента
        return () => {
            vapi.off('call-start', onCallStart); // Отписываемся от события начала звонка
            vapi.off('call-end', onCallEnd); // Отписываемся от события окончания звонка
            vapi.off('message', onMessage); // Отписываемся от события сообщения
            vapi.off('error', onError); // Отписываемся от события ошибки
            vapi.off('speech-start', onSpeechStart); // Отписываемся от события начала речи
            vapi.off('speech-end', onSpeechEnd); // Отписываемся от события окончания речи
        };
    }, []); // Пустой массив зависимостей: эффект выполняется один раз при монтировании

    // Функция для переключения состояния микрофона
    const toggleMicrophone = () => {
        const isMuted = vapi.isMuted(); // Проверяем текущее состояние микрофона
        vapi.setMuted(!isMuted); // Устанавливаем противоположное состояние
        setIsMuted(!isMuted); // Обновляем состояние в компоненте
    };

    // Функция для начала звонка
    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING); // Устанавливаем статус CONNECTING

        // Настройки для ассистента
        const assistantOverrides = {
            variableValues: { subject, topic, style }, // Переменные для ассистента (предмет, тема, стиль)
            clientMessages: ["transcript"], // Сообщения, которые клиент хочет получать
            serverMessages: [], // Сообщения от сервера (пустой массив)
        };

        // Запуск ассистента с конфигурацией и переопределениями
        vapi.start(configureAssistant(voice, style), assistantOverrides);
    };

    // Функция для завершения звонка
    const handleDisconnect = () => {
        setCallStatus(CallStatus.FINISHED); // Устанавливаем статус FINISHED
        vapi.stop(); // Останавливаем звонок через vapi
    };

    // JSX для рендеринга компонента
    return (
        <section className="flex flex-col h-[70vh]"> {/* Основной контейнер с высотой 70% высоты экрана */}
            {/* Верхний блок с аватарами ассистента и пользователя */}
            <section className="flex gap-8 max-sm:flex-col"> {/* Flex-контейнер, на маленьких экранах становится колонкой */}
                {/* Блок с аватаром ассистента */}
                <div className="companion-section">
                    <div className="companion-avatar" style={{ backgroundColor: getSubjectColor(subject) }}> {/* Аватар с фоном, зависящим от предмета */}
                        {/* Иконка ассистента, отображается в неактивном или завершенном состоянии */}
                        <div
                            className={cn(
                                'absolute transition-opacity duration-1000', // Утилита cn для условных классов
                                callStatus === CallStatus.FINISHED || callStatus === CallStatus.INACTIVE ? 'opacity-1001' : 'opacity-0', // Показываем иконку, если звонок неактивен или завершен
                                callStatus === CallStatus.CONNECTING && 'opacity-100 animate-pulse' // Пульсация при подключении
                            )}
                        >
                            <Image src={`/icons/${subject}.svg`} alt={subject} width={150} height={150} className="max-sm:w-fit" /> {/* Иконка предмета */}
                        </div>

                        {/* Анимация звуковых волн, отображается при активном звонке */}
                        <div className={cn('absolute transition-opacity duration-1000', callStatus === CallStatus.ACTIVE ? 'opacity-100' : 'opacity-0')}>
                            <Lottie
                                lottieRef={lottieRef} // Ссылка на анимацию
                                animationData={soundwaves} // Данные анимации звуковых волн
                                autoplay={false} // Анимация не запускается автоматически
                                className="companion-lottie" // Класс для стилизации
                            />
                        </div>
                    </div>
                    <p className="font-bold text-2xl">{name}</p> {/* Имя ассистента */}
                </div>

                {/* Блок с аватаром пользователя и управлением */}
                <div className="user-section">
                    <div className="user-avatar">
                        <Image src={userImage} alt={userName} width={130} height={130} className="rounded-lg" /> {/* Аватар пользователя */}
                        <p className="font-bold text-2xl">{userName}</p> {/* Имя пользователя */}
                    </div>

                    {/* Кнопка переключения микрофона */}
                    <button className="btn-mic" onClick={toggleMicrophone} disabled={callStatus !== CallStatus.ACTIVE}> {/* Активна только при активном звонке */}
                        <Image src={isMuted ? '/icons/mic-off.svg' : '/icons/mic-on.svg'} alt="mic" width={36} height={36} /> {/* Иконка микрофона */}
                        <p className="max-sm:hidden"> {/* Скрываем текст на маленьких экранах */}
                            {isMuted ? 'Turn on microphone' : 'Turn off microphone'} {/* Текст кнопки */}
                        </p>
                    </button>

                    {/* Кнопка запуска/остановки сессии */}
                    <button
                        className={cn(
                            'rounded-lg py-2 cursor-pointer transition-colors w-full text-white', // Базовые стили
                            callStatus === CallStatus.ACTIVE ? 'bg-red-700' : 'bg-primary', // Красный фон для активного звонка, иначе основной цвет
                            callStatus === CallStatus.CONNECTING && 'animate-pulse' // Пульсация при подключении
                        )}
                        onClick={callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall} // Запуск или остановка звонка
                    >
                        {callStatus === CallStatus.ACTIVE
                            ? "End Session" // Текст для активного звонка
                            : callStatus === CallStatus.CONNECTING
                                ? 'Connecting' // Текст при подключении
                                : 'Start Session' // Текст для неактивного состояния
                        }
                    </button>
                </div>
            </section>

            {/* Блок со стенограммой сообщений */}
            <section className="transcript">
                <div className="transcript-message no-scrollbar"> {/* Контейнер для сообщений без полосы прокрутки */}
                    {messages.map((message, index) => { // Перебираем массив сообщений
                        if (message.role === 'assistant') { // Если сообщение от ассистента
                            return (
                                <p key={index} className="max-sm:text-sm"> {/* Меньший шрифт на маленьких экранах */}
                                    {name.split(' ')[0].replace('/[.,]/g', ',')}: {message.content} {/* Имя ассистента и текст сообщения */}
                                </p>
                            );
                        } else { // Если сообщение от пользователя
                            return (
                                <p key={index} className="text-primary max-sm:text-sm"> {/* Цвет текста для пользователя */}
                                    {userName}: {message.content} {/* Имя пользователя и текст сообщения */}
                                </p>
                            );
                        }
                    })}
                </div>
                <div className="transcript-fade" /> {/* Элемент для эффекта затухания внизу стенограммы */}
            </section>
        </section>
    );
};

// Экспорт компонента по умолчанию
export default CompanionComponent;