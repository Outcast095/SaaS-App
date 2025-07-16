'use server';

import {auth} from "@clerk/nextjs/server";
import {createSupabaseClient} from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// Экспортируем асинхронную функцию createCompanion, которая принимает объект formData с типом CreateCompanion
export const createCompanion = async (formData: CreateCompanion) => {
    // Получаем userId текущего пользователя через функцию auth() из Clerk и переименовываем его в author
    const { userId: author } = await auth();

    // Создаем клиент Supabase для взаимодействия с базой данных
    const supabase = createSupabaseClient();

    // Выполняем запрос к таблице 'companions' в Supabase:
    // - Вставляем новую запись, объединяя данные из formData и поле author (userId)
    // - Метод .select() указывает, что нужно вернуть созданную запись
    const { data, error } = await supabase
        .from('companions') // Этот метод указывает, с какой таблицей в базе данных Supabase ты хочешь работать.
        .insert({ ...formData, author }) // Этот метод указывает, что нужно вставить новую запись в таблицу companions.
        .select(); //Этот метод указывает, что после выполнения вставки нужно вернуть данные созданной записи.

    // Проверяем, произошла ли ошибка при выполнении запроса или отсутствуют ли данные
    // Если есть error или data равно null/undefined, выбрасываем исключение
    // Используем сообщение из error.message, если оно есть, иначе общее сообщение
    if (error || !data) throw new Error(error?.message || 'Failed to create a companion');

    // Возвращаем первую (и единственную) созданную запись из массива data
    return data[0];
};




//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Экспортируем асинхронную функцию getAllCompanions, которая принимает объект с параметрами
// limit (по умолчанию 10), page (по умолчанию 1), subject и topic
export const getAllCompanions = async ({ limit = 10, page = 1, subject, topic }: GetAllCompanions) => {
    // Создаем клиент Supabase для взаимодействия с базой данных
    const supabase = createSupabaseClient();

    // Инициализируем запрос к таблице 'companions' с методом select() (выбираем все поля по умолчанию)
    let query = supabase.from('companions').select();

    // Условие: если переданы и subject, и topic
    if (subject && topic) {
        // Фильтруем записи, где поле subject содержит подстроку subject (без учета регистра)
        // И где поле topic или name содержат подстроку topic (без учета регистра)
        query = query.ilike('subject', `%${subject}%`)
            // в bd supabase в таблице сompanions есть столбец subject в этом столбце ilike для поиска подстроки в поле subject (без учета регистра, %${subject}% означает "содержит subject").

            //.or() объединяет два условия:
            //topic.ilike.%${topic}% — ищет записи, где поле topic содержит подстроку topic (без учета регистра).
            //name.ilike.%${topic}% — ищет записи, где поле name содержит подстроку topic (без учета регистра).
            //Запись будет возвращена, если хотя бы одно из этих условий истинно.
            .or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`);
    }
    // Условие: если передан только subject
    else if (subject) {
        // Фильтруем записи, где поле subject содержит подстроку subject
        query = query.ilike('subject', `%${subject}%`);
    }
    // Условие: если передан только topic
    else if (topic) {
        // Фильтруем записи, где поле topic или name содержат подстроку topic
        query = query.or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`);
    }

    // Применяем пагинацию: выбираем диапазон записей от (page-1)*limit до page*limit-1
    query = query.range((page - 1) * limit, page * limit - 1);

    // Выполняем запрос и деструктурируем результат на данные (companions) и ошибку (error)
    const { data: companions, error } = await query;

    // Если произошла ошибка, выбрасываем исключение с текстом ошибки
    if (error) throw new Error(error.message);

    // Возвращаем полученные данные (массив companions)
    return companions;
};




//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Экспортируем асинхронную функцию getCompanion, которая принимает параметр id (строка)
export const getCompanion = async (id: string) => {
    // Создаем клиент Supabase для взаимодействия с базой данных
    const supabase = createSupabaseClient();

    // Выполняем запрос к таблице 'companions' в базе данных Supabase
    // Метод .from('companions') указывает таблицу, из которой запрашиваются данные
    // Метод .select() без параметров выбирает все поля из таблицы
    // Метод .eq('id', id) фильтрует записи, возвращая только те, где поле 'id' равно переданному параметру id
    const { data, error } = await supabase
        .from('companions')
        .select()
        .eq('id', id);

    // Если произошла ошибка при выполнении запроса, выводим её в консоль и завершаем выполнение
    if (error) return console.log(error);

    // Возвращаем первую запись из массива данных (data[0]), так как предполагается, что id уникален
    return data[0];
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Экспортируем асинхронную функцию addToSessionHistory, которая принимает параметр companionId (строка)
export const addToSessionHistory = async (companionId: string) => {
    // Получаем userId из функции auth() (предположительно, функция аутентификации, возвращающая данные пользователя)
    const { userId } = await auth();

    // Создаем клиент Supabase для взаимодействия с базой данных
    const supabase = createSupabaseClient();

    // Выполняем запрос к таблице 'session_history' в базе данных Supabase
    // Метод .insert() добавляет новую запись в таблицу
    const { data, error } = await supabase.from('session_history')
        .insert({
            companion_id: companionId, // Поле companion_id заполняется переданным параметром companionId
            user_id: userId,         // Поле user_id заполняется полученным userId из auth()
        });

    // Если произошла ошибка при выполнении запроса, выбрасываем исключение с текстом ошибки
    if (error) throw new Error(error.message);

    // Возвращаем данные, полученные после успешной вставки записи
    return data;
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Экспортируем асинхронную функцию getRecentSessions, которая принимает необязательный параметр limit (по умолчанию 10)
export const getRecentSessions = async (limit = 10) => {
    // Создаем клиент Supabase для взаимодействия с базой данных
    const supabase = createSupabaseClient();

    // Выполняем запрос к таблице 'session_history' в базе данных Supabase
    // Метод .from('session_history') указывает таблицу, из которой запрашиваются данные
    // Метод .select(`companions:companion_id (*)`) выбирает данные из связанной таблицы (по полю companion_id),
    // где companions — это псевдоним для связанных данных, а (*) означает выбор всех полей из связанной таблицы
    // Метод .order('created_at', { ascending: false }) сортирует результаты по полю created_at в порядке убывания (от новых к старым)
    // Метод .limit(limit) ограничивает количество возвращаемых записей значением, указанным в параметре limit
    const { data, error } = await supabase
        .from('session_history')
        .select(`companions:companion_id (*)`)
        .order('created_at', { ascending: false })
        .limit(limit);

    // Если произошла ошибка при выполнении запроса, выбрасываем исключение с текстом ошибки
    if (error) throw new Error(error.message);

    // Преобразуем полученные данные: из каждой записи извлекаем только поле companions
    // Метод .map(({ companions }) => companions) возвращает массив, содержащий только данные компаньонов
    return data.map(({ companions }) => companions);
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



// Экспортируем асинхронную функцию getUserSessions, которая принимает два параметра:
// userId (строка, идентификатор пользователя) и limit (число, по умолчанию 10)
export const getUserSessions = async (userId: string, limit = 10) => {
    // Создаем клиент Supabase для взаимодействия с базой данных
    const supabase = createSupabaseClient();

    // Выполняем запрос к таблице 'session_history' в базе данных Supabase
    // Метод .from('session_history') указывает таблицу, из которой запрашиваются данные
    // Метод .select(`companions:companion_id (*)`) выбирает данные из связанной таблицы (по полю companion_id),
    // где companions — это псевдоним для связанных данных, а (*) означает выбор всех полей из связанной таблицы
    // Метод .eq('user_id', userId) фильтрует записи, возвращая только те, где поле user_id равно переданному userId
    // Метод .order('created_at', { ascending: false }) сортирует результаты по полю created_at в порядке убывания (от новых к старым)
    // Метод .limit(limit) ограничивает количество возвращаемых записей значением, указанным в параметре limit
    const { data, error } = await supabase
        .from('session_history')
        .select(`companions:companion_id (*)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    // Если произошла ошибка при выполнении запроса, выбрасываем исключение с текстом ошибки
    if (error) throw new Error(error.message);

    // Преобразуем полученные данные: из каждой записи извлекаем только поле companions
    // Метод .map(({ companions }) => companions) возвращает массив, содержащий только данные компаньонов
    return data.map(({ companions }) => companions);
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



// Экспортируем асинхронную функцию getUserCompanions, которая принимает параметр userId (строка)
export const getUserCompanions = async (userId: string) => {
    // Создаем клиент Supabase для взаимодействия с базой данных
    const supabase = createSupabaseClient();

    // Выполняем запрос к таблице 'companions' в базе данных Supabase
    // Метод .from('companions') указывает таблицу, из которой запрашиваются данные
    // Метод .select() без параметров выбирает все поля из таблицы
    // Метод .eq('author', userId) фильтрует записи, возвращая только те, где поле 'author' равно переданному userId
    const { data, error } = await supabase
        .from('companions')
        .select()
        .eq('author', userId);

    // Если произошла ошибка при выполнении запроса, выбрасываем исключение с текстом ошибки
    if (error) throw new Error(error.message);

    // Возвращаем полученные данные (массив записей из таблицы 'companions')
    return data;
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Экспортируем асинхронную функцию newCompanionPermissions без параметров
export const newCompanionPermissions = async () => {
    // Получаем userId и функцию has из функции auth()
    // Предположительно, auth() возвращает объект с userId (идентификатор пользователя)
    // и has (функция для проверки прав доступа или подписки пользователя)
    const { userId, has } = await auth();

    // Создаем клиент Supabase для взаимодействия с базой данных
    const supabase = createSupabaseClient();

    // Инициализируем переменную limit для ограничения количества компаньонов
    let limit = 0;

    // Проверяем, имеет ли пользователь подписку уровня 'pro'
    // Если да, возвращаем true (без ограничений на создание компаньонов)
    if (has({ plan: 'pro' })) {
        return true;
        // Если у пользователя есть право на создание до 3 компаньонов
    } else if (has({ feature: "3_companion_limit" })) {
        limit = 3;
        // Если у пользователя есть право на создание до 10 компаньонов
    } else if (has({ feature: "10_companion_limit" })) {
        limit = 10;
    }

    // Выполняем запрос к таблице 'companions' в базе данных Supabase
    // Метод .from('companions') указывает таблицу
    // Метод .select('id', { count: 'exact' }) выбирает только поле id и запрашивает точное количество записей
    // Метод .eq('author', userId) фильтрует записи, где поле author равно userId
    const { data, error } = await supabase
        .from('companions')
        .select('id', { count: 'exact' })
        .eq('author', userId);

    // Если произошла ошибка при выполнении запроса, выбрасываем исключение с текстом ошибки
    if (error) throw new Error(error.message);

    // Получаем количество компаньонов, созданных пользователем
    const companionCount = data?.length;

    // Проверяем, достиг ли пользователь лимита на создание компаньонов
    // Если текущее количество компаньонов больше или равно лимиту, возвращаем false
    if (companionCount >= limit) {
        return false;
        // Если лимит не достигнут, возвращаем true (пользователь может создать нового компаньона)
    } else {
        return true;
    }
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Экспортируем асинхронную функцию addBookmark, которая принимает два параметра:
// companionId (строка, идентификатор компаньона) и path (строка, путь для инвалидации кэша)
export const addBookmark = async (companionId: string, path: string) => {
    // Получаем userId из функции auth() (предположительно, функция аутентификации, возвращающая данные пользователя)
    const { userId } = await auth();

    // Если userId отсутствует (пользователь не аутентифицирован), функция завершает выполнение
    if (!userId) return;

    // Создаем клиент Supabase для взаимодействия с базой данных
    const supabase = createSupabaseClient();

    // Выполняем запрос к таблице 'bookmarks' в базе данных Supabase
    // Метод .from("bookmarks") указывает таблицу, в которую будут добавлены данные
    // Метод .insert() добавляет новую запись с полями companion_id и user_id
    // companion_id: значение переданного параметра companionId
    // user_id: значение userId, полученное из auth()
    const { data, error } = await supabase.from("bookmarks").insert({
        companion_id: companionId,
        user_id: userId,
    });

    // Если произошла ошибка при выполнении запроса, выбрасываем исключение с текстом ошибки
    if (error) {
        throw new Error(error.message);
    }

    // Вызываем функцию revalidatePath для инвалидации кэша страницы, указанной в параметре path
    // Это обновляет данные на странице, чтобы отразить добавление новой закладки (используется в Next.js)
    revalidatePath(path);

    // Возвращаем данные, полученные после вставки (обычно это массив вставленных записей)
    return data;
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Экспортируем асинхронную функцию removeBookmark, которая принимает два параметра:
// companionId (строка, идентификатор компаньона) и path (строка, путь для инвалидации кэша)
export const removeBookmark = async (companionId: string, path: string) => {
    // Получаем userId из функции auth() (предположительно, функция аутентификации, возвращающая данные пользователя)
    const { userId } = await auth();

    // Если userId отсутствует (пользователь не аутентифицирован), функция завершает выполнение
    if (!userId) return;

    // Создаем клиент Supabase для взаимодействия с базой данных
    const supabase = createSupabaseClient();

    // Выполняем запрос к таблице 'bookmarks' в базе данных Supabase
    // Метод .delete() указывает, что нужно удалить записи
    // Метод .eq("companion_id", companionId) фильтрует записи, где поле companion_id равно переданному companionId
    // Метод .eq("user_id", userId) дополнительно фильтрует записи, где поле user_id равно userId
    // Это обеспечивает удаление только той закладки, которая принадлежит текущему пользователю и связана с указанным компаньоном
    const { data, error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("companion_id", companionId)
        .eq("user_id", userId);

    // Если произошла ошибка при выполнении запроса, выбрасываем исключение с текстом ошибки
    if (error) {
        throw new Error(error.message);
    }

    // Вызываем функцию revalidatePath для инвалидации кэша страницы, указанной в параметре path
    // Это обновляет данные на странице, чтобы отразить удаление закладки (используется в Next.js)
    revalidatePath(path);

    // Возвращаем данные, полученные после удаления (обычно это массив удаленных записей или null)
    return data;
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// It's almost the same as getUserCompanions, but it's for the bookmarked companions
export const getBookmarkedCompanions = async (userId: string) => {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
        .from("bookmarks")
        .select(`companions:companion_id (*)`) // Notice the (*) to get all the companion data
        .eq("user_id", userId);


    if (error) {
        throw new Error(error.message);
    }
    // We don't need the bookmarks data, so we return only the companions
    return data.map(({ companions }) => companions);
};