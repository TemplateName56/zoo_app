import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import LightThemeSwitcher from "./components/LightThemeSwitcher"; // шлях до файлу

const queryClient = new QueryClient();

export default function RootLayout() {
    // @ts-ignore
    global.user = null;
    return (
        <QueryClientProvider client={queryClient}>
            <LightThemeSwitcher>
                <Stack />
            </LightThemeSwitcher>
        </QueryClientProvider>
    );
}