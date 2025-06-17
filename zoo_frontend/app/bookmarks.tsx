import React, { useEffect, useState } from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import { Card, Text, Avatar } from "react-native-paper";
import { useRouter } from "expo-router";
import api from "./api/api";
import { Animal } from "./types/animal";

const getBookmarkedAnimals = async () => {
    const res = await api.get("/bookmarks/my");
    return res.data.items as Animal[]; // масив тварин
};

export default function BookmarksScreen() {
    const [animals, setAnimals] = useState<Animal[]>([]);
    const router = useRouter();

    useEffect(() => {
        getBookmarkedAnimals().then(setAnimals);
    }, []);

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {animals.length === 0 ? (
                <Text style={{marginTop:40, textAlign:"center"}}>Немає збережених тварин.</Text>
            ) : animals.map(animal => (
                <Card key={animal.id} style={styles.card} onPress={() => router.push(`/${animal.id}`)}>
                    <Card.Title
                        title={animal.name}
                        subtitle={animal.type + (animal.breed ? ` • ${animal.breed}` : "")}
                        left={(props) => <Avatar.Image {...props} source={{ uri: animal.photo_url }} />}
                    />
                    <Card.Cover source={{ uri: animal.photo_url }} style={styles.image} />
                </Card>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, paddingBottom: 32 },
    card: { marginBottom: 16, borderRadius: 18, backgroundColor: "#fff", elevation: 3 },
    image: { height: 180, borderRadius: 12, marginHorizontal: 12, marginBottom: 10, marginTop: 4 },
});