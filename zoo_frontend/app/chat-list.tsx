import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import {Card, Text, Button, Avatar, useTheme} from "react-native-paper";
import {Stack, useRouter} from "expo-router";
import api from "./api/api";

interface Chat {
    id: number;
    animal?: { name: string };
    companion: { id: number; name: string; avatar_url?: string };
}

export default function ChatListScreen() {
    const [chats, setChats] = useState<Chat[]>([]);
    const router = useRouter();
    const theme = useTheme();

    useEffect(() => {
        api.get("/chats").then(res => setChats(res.data));
    }, []);

    return (
        <ScrollView style={{backgroundColor: theme.colors.background}} contentContainerStyle={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Чати',
                    headerStyle: { backgroundColor: theme.colors.elevation.level1 },
                    headerTintColor: theme.colors.primary,
                    headerTitleStyle: { color: theme.colors.primary },
                }}
            />
            <Text variant="headlineMedium" style={{marginBottom: 18, textAlign: "center"}}>Ваші чати</Text>
            {chats.length > 0 ? chats.map(item => (
                <Card
                    key={item.id}
                    style={styles.card}
                    onPress={() => router.push(`/chat/${item.id}`)}
                >
                    <Card.Title
                        title={item.companion?.name || "Без імені"}
                        subtitle={item.animal ? `Тварина: ${item.animal.name}` : ""}
                        left={(props) =>
                            item.companion?.avatar_url
                                ? <Avatar.Image {...props} source={{ uri: item.companion.avatar_url }} />
                                : <Avatar.Text {...props} label={item.companion?.name?.[0] || "?"} />
                        }
                    />
                </Card>
            )) : (
                <Text style={{marginTop: 40, textAlign: "center"}}>Немає чатів</Text>
            )}
            <Button style={{marginTop: 18}} icon="arrow-left" mode="outlined" onPress={() => router.back()}>Назад</Button>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, paddingBottom: 40 },
    card: { marginBottom: 14, borderRadius: 14, elevation: 2},
});