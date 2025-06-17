import React, {Component, useEffect, useState} from "react";
import { Alert, ScrollView, StyleSheet, View, Dimensions } from "react-native";
import { Card, Avatar, Text, Button } from "react-native-paper";
import {Stack, useLocalSearchParams, useRouter} from "expo-router";
import api from "./api/api";
import Mapbox, { MapView, MarkerView, Camera, PointAnnotation } from "@rnmapbox/maps";


// @ts-ignore
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN);
Mapbox.setTelemetryEnabled(false);

export default function AnimalDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [animal, setAnimal] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        api.get(`/animals/${id}`).then(res => setAnimal(res.data));
    }, [id]);

    const handleDelete = async () => {
        Alert.alert(
            "Підтвердження",
            "Ви дійсно хочете видалити цю тваринку?",
            [
                { text: "Скасувати", style: "cancel" },
                {
                    text: "Видалити",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.delete(`/animals/${id}`);
                            Alert.alert("Успіх", "Тваринку видалено");
                            router.replace("/"); // або список тварин
                        } catch (e) {
                            Alert.alert("Помилка", "Не вдалося видалити тваринку");
                        }
                    }
                }
            ]
        );
    };

    if (!animal) return <Text style={{marginTop: 30, textAlign: "center"}}>Завантаження...</Text>;

    // @ts-ignore
    const isOwner = animal.owner_id === global.user?.id;

    const hasCoords = !!animal.lat && !!animal.lng && !isNaN(Number(animal.lat)) && !isNaN(Number(animal.lng));
    const lat = Number(animal.lat);
    const lng = Number(animal.lng);

    return (
        <ScrollView style={{backgroundColor: "#f7f7f7"}} contentContainerStyle={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Сторінка тваринки',
                }}
            />
            <Card style={styles.card}>
                <Card.Cover source={{ uri: animal.photo_url }} style={styles.mainPhoto} />
                <Card.Title
                    title={animal.name}
                    subtitle={animal.type + (animal.breed ? ` • ${animal.breed}` : "")}
                    left={(props) => <Avatar.Image {...props} source={{ uri: animal.photo_url }} />}
                />
                <Card.Content>
                    <Text style={{marginBottom: 8}}>Вік: {animal.age || "?"} • Стать: {animal.sex === "male" ? "Ч" : "Ж"}</Text>
                    <Text variant="bodyMedium">{animal.description}</Text>
                </Card.Content>
            </Card>

            {/* Мапа з маркером */}
            {hasCoords && (
                <View style={styles.mapWrap}>
                    <Text style={{ fontWeight: "bold", marginBottom: 8, textAlign: 'center' }}>Місце розташування</Text>
                    <MapView
                        style={styles.map}
                        styleURL={Mapbox.StyleURL.Street}
                        logoEnabled={false}
                        compassEnabled={true}
                        scrollEnabled={true}
                        zoomEnabled={true}
                        pitchEnabled={false}
                        rotateEnabled={false}
                    >
                        <Camera
                            zoomLevel={15}
                            centerCoordinate={[lng, lat]}
                        />
                        <PointAnnotation id="animal-location" coordinate={[lng, lat]}>
                            <View style={styles.marker} />
                        </PointAnnotation>
                    </MapView>
                </View>
            )}

            {/* Кнопка видалення тільки для власника */}
            {isOwner && (
                <Button
                    mode="contained"
                    icon="delete"
                    style={{marginTop: 16, backgroundColor: "#e53935"}}
                    onPress={handleDelete}
                >
                    Видалити тваринку
                </Button>
            )}
            <Button
                style={{marginTop: 16}}
                mode="outlined"
                icon="arrow-left"
                onPress={() => router.back()}
            >
                Назад
            </Button>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, alignItems: "stretch", paddingBottom: 40 },
    card: { marginBottom: 24, borderRadius: 14, elevation: 2 },
    mainPhoto: { height: 200, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
    mapWrap: { marginTop: 20, marginBottom: 12, borderRadius: 14, overflow: "hidden", backgroundColor: "#eaeaea" },
    map: {
        width: "100%",
        height: 220,
    },
    marker: {
        width: 28,
        height: 28,
        backgroundColor: "#e53935",
        borderRadius: 14,
        borderWidth: 2,
        borderColor: "#fff",
    },
});