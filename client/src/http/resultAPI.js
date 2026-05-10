import {$authHost, $host} from "./index";

export const createResult = async (resultsData) => {
    const { data } = await $authHost.post('/api/results', resultsData);
    return data;
};

export const fetchResults = async (difficulty, mode) => {
    const { data } = await $host.get('api/results', {
        params: { difficulty, mode }
    });
    return data;
};

export const fetchAllResults = async () => {
    const { data } = await $authHost.get('/api/results');
    return data;
};

export const fetchUserResults = async (userId) => {
    const {data} = await $authHost.get(`/api/results/${userId}`);
    return data;
}