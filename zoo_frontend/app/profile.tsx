import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Avatar, Text, Card, Button } from "react-native-paper";
import api from "./api/api";
import { User } from "./types/user";
import { Animal } from "./types/animal";
import {Stack, useRouter} from "expo-router";

export default function ProfileScreen() {
    const [profile, setProfile] = useState<User | null>(null);
    const [myAnimals, setMyAnimals] = useState<Animal[]>([]);
    const router = useRouter();

    useEffect(() => {
        api.get("/auth/me").then(res => setProfile(res.data));
        api.get("/animals/mine").then(res => setMyAnimals(res.data));
    }, []);

    const logout = () => {
        // @ts-ignore
        global.token = null;
        global.user = null;
        router.replace("/");
    };

    if (!profile) return (
        <View>
            <Stack.Screen
                options={{
                    title: 'Профіль',
                }}
            />
            <Text style={{marginTop: 50, textAlign: "center"}}>Завантаження...</Text>
        </View>
    );

    return (
        <ScrollView style={styles.bg} contentContainerStyle={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Профіль',
                }}
            />
            <Card style={styles.card}>
                <Card.Content style={{alignItems: "center"}}>
                    <Avatar.Image
                        size={110}
                        source={profile.avatar_url ? { uri: profile.avatar_url } : require("../assets/avatar-placeholder.jpg")}
                        style={{ marginBottom: 12 }}
                    />
                    <Text variant="headlineMedium">{profile.name}</Text>
                    <Text variant="bodyMedium" style={{marginTop: 8}}>Email: {profile.email}</Text>
                    {profile.phone ? <Text variant="bodyMedium">Телефон: {profile.phone}</Text> : null}
                    <Button
                        mode="outlined"
                        icon="logout"
                        style={{marginTop: 16}}
                        onPress={logout}
                    >
                        Вийти
                    </Button>
                </Card.Content>
            </Card>

            <Text variant="titleLarge" style={{marginTop: 26, marginBottom: 10}}>Мої тваринки</Text>
            {myAnimals.length === 0 && (
                <Text style={{color: "#888", marginTop: 6, textAlign: "center"}}>Ви ще не додали жодної тваринки.</Text>
            )}
            {myAnimals.map(animal => (
                <Card key={animal.id} style={styles.animalCard} onPress={() => router.push(`/${animal.id}`)}>
                    <Card.Title
                        title={animal.name}
                        subtitle={animal.type + (animal.breed ? ` • ${animal.breed}` : "")}
                        left={(props) => (
                            <Avatar.Image
                                {...props}
                                source={{ uri: animal.photo_url }}
                                style={{ backgroundColor: "#eee" }}
                            />
                        )}
                    />
                    <Card.Content>
                        <Text numberOfLines={2} style={{color: "#888"}}>{animal.description}</Text>
                    </Card.Content>
                </Card>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    bg: { backgroundColor: "#f7f7f7" },
    container: { padding: 24, paddingBottom: 50 },
    card: { borderRadius: 20, paddingVertical: 32, elevation: 3 },
    animalCard: { marginBottom: 14, borderRadius: 15, elevation: 2, backgroundColor: "#fff" },
});

