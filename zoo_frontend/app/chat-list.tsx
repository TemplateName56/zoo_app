import React, { useEffect, useState } from "react";
import {Alert, ScrollView, StyleSheet} from "react-native";
import {Card, Text, Button, Avatar, useTheme, IconButton} from "react-native-paper";
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

    const handleDeleteChat = (chatId: number) => {
        Alert.alert(
            "Підтвердження",
            "Ви дійсно бажаєте видалити цей чат?",
            [
                { text: "Скасувати", style: "cancel" },
                {
                    text: "Видалити",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.delete(`/chats/${chatId}`);
                            setChats(prev => prev.filter(c => c.id !== chatId));
                        } catch {
                            Alert.alert("Помилка", "Не вдалося видалити чат.");
                        }
                    }
                }
            ]
        );
    };

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
                        right={(props) => (
                            <IconButton
                                {...props}
                                icon="delete"
                                color="red"
                                onPress={() => handleDeleteChat(item.id)}
                            />
                        )}
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