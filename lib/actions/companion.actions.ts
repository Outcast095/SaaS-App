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


export const getCompanion = async (id: string) => {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
        .from('companions')
        .select()
        .eq('id', id);

    if(error) return console.log(error);

    return data[0];
}

export const addToSessionHistory = async (companionId: string) => {
    const { userId } = await auth();
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.from('session_history')
        .insert({
            companion_id: companionId,
            user_id: userId,
        })

    if(error) throw new Error(error.message);

    return data;
}

export const getRecentSessions = async (limit = 10) => {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
        .from('session_history')
        .select(`companions:companion_id (*)`)
        .order('created_at', { ascending: false })
        .limit(limit)

    if(error) throw new Error(error.message);

    return data.map(({ companions }) => companions);
}

export const getUserSessions = async (userId: string, limit = 10) => {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
        .from('session_history')
        .select(`companions:companion_id (*)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if(error) throw new Error(error.message);

    return data.map(({ companions }) => companions);
}

export const getUserCompanions = async (userId: string) => {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
        .from('companions')
        .select()
        .eq('author', userId)

    if(error) throw new Error(error.message);

    return data;
}

export const newCompanionPermissions = async () => {
    const { userId, has } = await auth();
    const supabase = createSupabaseClient();

    let limit = 0;

    if(has({ plan: 'pro' })) {
        return true;
    } else if(has({ feature: "3_companion_limit" })) {
        limit = 3;
    } else if(has({ feature: "10_companion_limit" })) {
        limit = 10;
    }

    const { data, error } = await supabase
        .from('companions')
        .select('id', { count: 'exact' })
        .eq('author', userId)

    if(error) throw new Error(error.message);

    const companionCount = data?.length;

    if(companionCount >= limit) {
        return false
    } else {
        return true;
    }
}

export const addBookmark = async (companionId: string, path: string) => {
    const { userId } = await auth();
    if (!userId) return;
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.from("bookmarks").insert({
        companion_id: companionId,
        user_id: userId,
    });
    if (error) {
        throw new Error(error.message);
    }
    // Revalidate the path to force a re-render of the page

    revalidatePath(path);
    return data;
};

export const removeBookmark = async (companionId: string, path: string) => {
    const { userId } = await auth();
    if (!userId) return;
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("companion_id", companionId)
        .eq("user_id", userId);
    if (error) {
        throw new Error(error.message);
    }
    revalidatePath(path);
    return data;
};

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