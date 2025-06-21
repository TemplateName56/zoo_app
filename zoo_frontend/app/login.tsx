import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import {TextInput, Button, Text, Card, useTheme} from "react-native-paper";
import {Stack, useRouter} from "expo-router";
import api from "./api/api";

export default function LoginScreen() {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [err, setErr] = useState<string>("");
    const router = useRouter();
    const theme = useTheme();

    const login = async () => {
        setErr("");
        try {
            const res = await api.post("/auth/login", { email, password });
            // @ts-ignore
            global.token = res.data.token;
            const ave = await api.get("/auth/me");
            if (ave.data.isBlocked === 1) {
                router.push("/");
            } else {
                // @ts-ignore
                global.user = ave.data;
                // @ts-ignore
                if (global.user.isAdmin === 1) {
                    router.push("/admin_screen");
                } else {
                    router.push("/");
                }
            }
        } catch (e) {
            setErr("Невірний логін або пароль");
        }
    };

    return (
        <View style={{flex: 1, justifyContent: "center", backgroundColor: theme.colors.background}}>
            <Stack.Screen
                options={{
                    title: 'Логін',
                    headerStyle: { backgroundColor: theme.colors.elevation.level1 },
                    headerTintColor: theme.colors.primary,
                    headerTitleStyle: { color: theme.colors.primary },
                }}
            />
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="headlineMedium" style={{marginBottom: 18, textAlign: "center"}}>Вхід</Text>
                    <TextInput
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        style={styles.input}
                        autoCapitalize="none"
                    />
                    <TextInput
                        label="Пароль"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        style={styles.input}
                    />
                    <Button mode="contained" style={styles.btn} onPress={login}>
                        Увійти
                    </Button>
                    <Button style={styles.btn} mode="text" onPress={() => router.push("/register")}>
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
    input: { marginBottom: 12 },
    btn: { marginTop: 6 },
});