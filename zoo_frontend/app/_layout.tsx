import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PaperProvider } from "react-native-paper";
import React from "react";

const queryClient = new QueryClient();

export default function RootLayout() {
    global.user = null;
    return (
        <QueryClientProvider client={queryClient}>
            <PaperProvider>
                <Stack />
            </PaperProvider>
        </QueryClientProvider>
    );
}