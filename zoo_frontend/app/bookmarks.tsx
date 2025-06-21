import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Card, Text, Avatar, useTheme } from "react-native-paper";
import {Stack, useRouter} from "expo-router";
import api from "./api/api";
import { Animal } from "./types/animal";

const getBookmarkedAnimals = async () => {
    const res = await api.get("/bookmarks");
    return res.data.items as Animal[];
};

export default function BookmarksScreen() {
    const [animals, setAnimals] = useState<Animal[]>([]);
    const router = useRouter();
    const theme = useTheme();
    const styles = getStyles(theme);

    useEffect(() => {
        getBookmarkedAnimals().then(setAnimals);
    }, []);

    return (
        <ScrollView contentContainerStyle={styles.container} style={{backgroundColor: theme.colors.background}}>
            <Stack.Screen options={{
                title: 'Обране',
                headerStyle: { backgroundColor: theme.colors.elevation.level1 },
                headerTintColor: theme.colors.primary,
                headerTitleStyle: { color: theme.colors.primary }, }} />
            {animals.length === 0 ? (
                <Text style={{ marginTop: 40, textAlign: "center", color: theme.colors.onBackground }}>
                    Немає збережених тварин.
                </Text>
            ) : animals.map(animal => (
                <Card
                    key={animal.id}
                    style={styles.card}
                    onPress={() => router.push(`/${animal.id}`)}
                >
                    <Card.Title
                        title={animal.name}
                        subtitle={animal.type + (animal.breed ? ` • ${animal.breed}` : "")}
                        left={(props) => <Avatar.Image {...props} source={{ uri: animal.photo_url }} />}
                        titleStyle={{ color: theme.colors.onSurface }}
                        subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
                    />
                    <Card.Cover source={{ uri: animal.photo_url }} style={styles.image} />
                </Card>
            ))}
        </ScrollView>
    );
}

const getStyles = (theme: any) => StyleSheet.create({
    container: { padding: 16, paddingBottom: 32, backgroundColor: theme.colors.background },
    card: {
        marginBottom: 16,
        borderRadius: 18,
        elevation: 3,
        backgroundColor: theme.colors.elevation.level1
    },
    image: { height: 180, borderRadius: 12, marginHorizontal: 12, marginBottom: 10, marginTop: 4 },
});