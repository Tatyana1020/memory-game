import AuthPage from "./pages/AuthPage";
import GamePage from "./pages/GamePage";
import HomePage from "./pages/HomePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import LobbyPage from "./pages/LobbyPage";
import ProfilePage from "./pages/ProfilePage";
import GameSetupPage from "./pages/GameSetupPage";
import {
    GAME_ROUTE,
    HOME_ROUTE,
    LEADERBOARD_ROUTE,
    LOGIN_ROUTE,
    LOBBY_ROUTE,
    PROFILE_ROUTE,
    REGISTRATION_ROUTE,
    SETUP_ROUTE
} from "./utils/consts";

export const authRoutes = [
    {
        path: PROFILE_ROUTE,
        Component: ProfilePage
    },
    {
        path: LOBBY_ROUTE + "/:id",
        Component: LobbyPage
    },
];

export const publicRoutes = [
    {
        path: HOME_ROUTE,
        Component: HomePage
    },
    {
        path: LOGIN_ROUTE,
        Component: AuthPage
    },
    {
        path: REGISTRATION_ROUTE,
        Component: AuthPage
    },
    {
        path: LEADERBOARD_ROUTE,
        Component: LeaderboardPage
    },
    {
        path: SETUP_ROUTE,
        Component: GameSetupPage
    },
    {
        path: GAME_ROUTE + "/:id?",
        Component: GamePage
    },
]