import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { TextInput, Button, Text, Card } from "react-native-paper";
import {Stack, useRouter} from "expo-router";
import api from "./api/api";

export default function RegisterScreen() {
    const [data, setData] = useState({ name: "", email: "", password: "" });
    const [err, setErr] = useState("");
    const router = useRouter();

    const register = async () => {
        setErr("");
        try {
            await api.post("/auth/register", data);
            router.push("/login");
        } catch (e) {
            setErr("Помилка реєстрації");
        }
    };

    return (
        <View style={styles.bg}>
            <Stack.Screen
                options={{
                    title: 'Регістрація',
                }}
            />
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="headlineMedium" style={{marginBottom: 18, textAlign: "center"}}>Реєстрація</Text>
                    <TextInput
                        label="Ім'я"
                        value={data.name}
                        onChangeText={v => setData({ ...data, name: v })}
                        style={styles.input}
                    />
                    <TextInput
                        label="Email"
                        value={data.email}
                        onChangeText={v => setData({ ...data, email: v })}
                        style={styles.input}
                        autoCapitalize="none"
                    />
                    <TextInput
                        label="Пароль"
                        secureTextEntry
                        value={data.password}
                        onChangeText={v => setData({ ...data, password: v })}
                        style={styles.input}
                    />
                    <Button mode="contained" style={styles.btn} onPress={register}>
                        Зареєструватися
                    </Button>
                    {err ? <Text style={{color: "red", marginTop: 12, textAlign: "center"}}>{err}</Text> : null}
                </Card.Content>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1, justifyContent: "center", backgroundColor: "#f7f7f7" },
    card: { margin: 20, borderRadius: 18, elevation: 4 },
    input: { marginBottom: 12, backgroundColor: "#fff" },
    btn: { marginTop: 6 },
});