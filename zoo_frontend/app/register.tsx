import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { TextInput, Button, Text, Card, useTheme } from "react-native-paper";
import {Stack, useRouter} from "expo-router";
import api from "./api/api";

export default function RegisterScreen() {
    const [data, setData] = useState({ name: "", email: "", password: "", phone: "" });
    const [err, setErr] = useState("");
    const router = useRouter();
    const theme = useTheme();

    const register = async () => {
        setErr("");
        try {
            await api.post("/auth/register", data);
            router.push("/login");
        } catch (e) {
            // @ts-ignore
            if (e.response && e.response.data && e.response.data.error) {
                // @ts-ignore
                setErr(e.response.data.error);
                // @ts-ignore
            } else if (e.message) {
                // @ts-ignore
                setErr("Помилка реєстрації: " + e.message);
            } else {
                setErr("Сталася невідома помилка");
            }
        }
    };

    return (
        <View style={{flex: 1, justifyContent: "center", backgroundColor: theme.colors.background}}>
            <Stack.Screen
                options={{
                    title: 'Регістрація',
                    headerStyle: { backgroundColor: theme.colors.elevation.level1 },
                    headerTintColor: theme.colors.primary,
                    headerTitleStyle: { color: theme.colors.primary },
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
                        label="Телефон"
                        value={data.phone}
                        onChangeText={v => setData({ ...data, phone: v })}
                        style={styles.input}
                        keyboardType="phone-pad"
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
    card: { margin: 20, borderRadius: 18, elevation: 4 },
    input: { marginBottom: 12},
    btn: { marginTop: 6 },
});