import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Avatar, Text, Card, useTheme } from "react-native-paper";
import api from "../api/api";
import { User } from "../types/user";
import { Animal } from "../types/animal";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

export default function UserProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [profile, setProfile] = useState<User | null>(null);
    const [userAnimals, setUserAnimals] = useState<Animal[]>([]);
    const router = useRouter();
    const theme = useTheme();

    useEffect(() => {
        if (!id) return;
        api.get(`/users/${id}`).then(res => setProfile(res.data));
        api.get(`/animals/owner?owner_id=${id}`).then(res => setUserAnimals(res.data));
    }, [id]);

    if (!profile) return (
        <View>
            <Stack.Screen
                options={{
                    title: 'Профіль користувача',
                }}
            />
            <Text style={{ marginTop: 50, textAlign: "center" }}>Завантаження...</Text>
        </View>
    );

    return (
        <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Профіль користувача',
                    headerStyle: { backgroundColor: theme.colors.elevation.level1 },
                    headerTintColor: theme.colors.primary,
                    headerTitleStyle: { color: theme.colors.primary },
                }}
            />
            <Card style={styles.card}>
                <Card.Content style={{ alignItems: "center" }}>
                    <Avatar.Image
                        size={110}
                        source={profile.avatar_url ? { uri: profile.avatar_url } : require("../../assets/avatar-placeholder.jpg")}
                        style={{ marginBottom: 12 }}
                    />
                    <Text variant="headlineMedium">{profile.name}</Text>
                    <Text variant="bodyMedium" style={{ marginTop: 8 }}>Email: {profile.email}</Text>
                    {profile.phone ? <Text variant="bodyMedium">Телефон: {profile.phone}</Text> : null}
                    {profile.isBlocked ? (
                        <Text style={{ color: "red", marginTop: 10 }}>Користувач заблокований</Text>
                    ) : null}
                </Card.Content>
            </Card>

            <Text variant="titleLarge" style={{ marginTop: 26, marginBottom: 10 }}>Тваринки користувача</Text>
            {userAnimals.length === 0 && (
                <Text style={{ color: "#888", marginTop: 6, textAlign: "center" }}>У користувача немає тваринок.</Text>
            )}
            {userAnimals.map(animal => (
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
                        <Text numberOfLines={2} style={{ color: "#888" }}>{animal.description}</Text>
                    </Card.Content>
                </Card>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 24, paddingBottom: 50 },
    card: { borderRadius: 20, paddingVertical: 32, elevation: 3 },
    animalCard: { marginBottom: 14, borderRadius: 15, elevation: 2 },
});