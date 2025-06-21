import React, { useEffect, useState, useRef } from "react";
import { ScrollView, View, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import {TextInput, Button, Text, Card, useTheme} from "react-native-paper";
import {Stack, useLocalSearchParams} from "expo-router";
import api from "../api/api";

interface Message {
    id: number;
    content: string;
    sender_id: number;
}

export default function ChatScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState("");
    const scrollViewRef = useRef<ScrollView>(null);
    const theme = useTheme();

    // @ts-ignore
    const myUserId = global.user?.id;

    const fetchMessages = () => {
        api.get(`/chats/${id}/messages`).then(res => setMessages(res.data));
    };

    useEffect(() => {
        fetchMessages();
    }, [id]);

    useEffect(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);

    const sendMessage = async () => {
        if (!text.trim()) return;
        await api.post(`/chats/${id}/messages`, { content: text });
        setText("");
        fetchMessages();
    };

    if (!myUserId) {
        return (
            <View style={{flex:1, justifyContent:"center", alignItems:"center"}}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: theme.colors.background}}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={styles.container}>
                <Stack.Screen
                    options={{
                        title: 'Чат',
                        headerStyle: { backgroundColor: theme.colors.elevation.level1 },
                        headerTintColor: theme.colors.primary,
                        headerTitleStyle: { color: theme.colors.primary },
                    }}
                />
                <ScrollView ref={scrollViewRef} style={styles.messages}>
                    {messages.map(item => {
                        const isMyMsg = item.sender_id === myUserId;
                        return (
                            <View
                                key={item.id}
                                style={[
                                    styles.msgWrap,
                                    isMyMsg ? styles.myMsg : styles.theirMsg
                                ]}
                            >
                                <Card
                                    style={[
                                        styles.msgCard,
                                        isMyMsg ? styles.myCard : styles.theirCard
                                    ]}
                                >
                                    <Card.Content>
                                        <Text style={isMyMsg ? styles.myText : styles.theirText}>
                                            {item.content}
                                        </Text>
                                    </Card.Content>
                                </Card>
                            </View>
                        );
                    })}
                </ScrollView>
                <View style={styles.inputRow}>
                    <TextInput
                        value={text}
                        onChangeText={setText}
                        style={styles.input}
                        placeholder="Повідомлення..."
                    />
                    <Button mode="contained" style={styles.sendBtn} onPress={sendMessage}>
                        Відправити
                    </Button>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 12, paddingBottom: 30 },
    messages: { flex: 1, marginBottom: 5 },
    msgWrap: { marginBottom: 10, flexDirection: "row" },
    myMsg: { alignSelf: "flex-end", justifyContent: "flex-end" },
    theirMsg: { alignSelf: "flex-start", justifyContent: "flex-start" },
    msgCard: { borderRadius: 16, maxWidth: "75%", padding: 0 },
    myCard: { backgroundColor: "#2196f3" },
    theirCard: { backgroundColor: "#e0e0e0" },
    myText: { color: "#fff", fontSize: 16 },
    theirText: { color: "#333", fontSize: 16 },
    inputRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
    input: { flex: 1, borderRadius: 8, marginRight: 10 },
    sendBtn: { borderRadius: 8 },
});