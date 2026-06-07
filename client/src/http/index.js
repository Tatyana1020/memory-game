import axios from "axios";

const isLocalhost = Boolean(
  window.location.hostname === "localhost" ||
    window.location.hostname === "[::1]" ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

const API_URL = isLocalhost 
  ? "http://localhost:5000/" 
  : "https://k5fwtc9b-5000.euw.devtunnels.ms/";

const $host = axios.create({
    baseURL: API_URL
});

const $authHost = axios.create({
    baseURL: API_URL
});

const authInterceptor = config => {
    config.headers.authorization = `Bearer ${localStorage.getItem('token')}`;
    return config;
}

$authHost.interceptors.request.use(authInterceptor);

export {
    $host,
    $authHost,
}