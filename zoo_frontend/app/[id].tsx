import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View, Image, Dimensions } from "react-native";
import { Card, Avatar, Text, Button, IconButton, useTheme, Modal, Portal } from "react-native-paper";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import api from "./api/api";
import Mapbox, { MapView, Camera, PointAnnotation } from "@rnmapbox/maps";

// @ts-ignore
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN);
Mapbox.setTelemetryEnabled(false);

interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    isBlocked?: boolean;
}

export default function AnimalDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [animal, setAnimal] = useState<any>(null);
    const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
    const [bookmarkId, setBookmarkId] = useState<number | null>(null);
    const [owner, setOwner] = useState<User | null>(null);
    const router = useRouter();
    const theme = useTheme();

    const [extraPhotos, setExtraPhotos] = useState<string[]>([]);
    const [photoModalVisible, setPhotoModalVisible] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    const windowWidth = Dimensions.get("window").width;
    const windowHeight = Dimensions.get("window").height;

    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                const res = await api.get(`/animals/${id}`);
                setAnimal(res.data);
                // Завантажити власника
                if (res.data.owner_id) {
                    try {
                        const userRes = await api.get(`/users/${res.data.owner_id}`);
                        if (!ignore) setOwner(userRes.data);
                    } catch {
                        if (!ignore) setOwner(null);
                    }
                } else {
                    setOwner(null);
                }
            } catch {
                setAnimal(null);
                setOwner(null);
            }
        })();
        return () => { ignore = true; };
    }, [id]);

    // Перевірка закладки для поточного користувача
    useEffect(() => {
        let ignore = false;
        (async () => {
            if (!global.user?.id) {
                setIsBookmarked(false);
                setBookmarkId(null);
                return;
            }
            try {
                const res = await api.get("/bookmarks");
                const found = res.data.items.find((a: any) =>
                    String(a.animal_id ?? a.id) === String(id)
                );
                if (!ignore) {
                    setIsBookmarked(!!found);
                    setBookmarkId(found?.bookmark_id || found?.id || null);
                }
            } catch {
                if (!ignore) {
                    setIsBookmarked(false);
                    setBookmarkId(null);
                }
            }
        })();
        return () => { ignore = true; };
    }, [id]);

    useEffect(() => {
        if (!id) return;
        api.get(`/animals/${id}/photos`)
            .then(res => setExtraPhotos(res.data.map((p: any) => p.photo_url)))
            .catch(() => setExtraPhotos([]));
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
                            router.replace("/");
                        } catch {
                            Alert.alert("Помилка", "Не вдалося видалити тваринку");
                        }
                    }
                }
            ]
        );
    };

    const handleBookmark = async () => {
        try {
            if (!isBookmarked) {
                const res = await api.post("/bookmarks/add", { animal_id: Number(id) });
                setIsBookmarked(true);
                setBookmarkId(res.data.id);
                Alert.alert("Додано у закладки!");
            } else if (bookmarkId) {
                await api.delete(`/bookmarks/${bookmarkId}`);
                setIsBookmarked(false);
                setBookmarkId(null);
                Alert.alert("Видалено із закладок.");
            }
        } catch {
            Alert.alert("Помилка", "Не вдалося змінити стан закладки.");
        }
    };

    const handleStartChat = async () => {
        if (!owner?.id) return;
        try {
            const res = await api.post("/chats", { other_user_id: owner.id, animal_id: animal.id });
            const chatId = res.data.id || res.data.chat_id;
            router.push(`/chat/${chatId}`);
        } catch {
            Alert.alert("Помилка", "Не вдалося почати чат із власником.");
        }
    };

    if (!animal) return <Text style={{ marginTop: 30, textAlign: "center" }}>Завантаження...</Text>;

    // @ts-ignore
    const isOwner = animal.owner_id === global.user?.id;
    const hasCoords = !!animal.lat && !!animal.lng && !isNaN(Number(animal.lat)) && !isNaN(Number(animal.lng));
    const lat = Number(animal.lat);
    const lng = Number(animal.lng);

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.container}>
                <Stack.Screen
                    options={{
                        title: 'Сторінка тваринки',
                        headerStyle: { backgroundColor: theme.colors.elevation.level1 },
                        headerTintColor: theme.colors.primary,
                        headerTitleStyle: { color: theme.colors.primary },
                    }}
                />
                <Card style={styles.card}>
                    <Card.Cover source={{ uri: animal.photo_url }} style={styles.mainPhoto} />
                    <Card.Title
                        title={animal.name}
                        subtitle={animal.type + (animal.breed ? ` • ${animal.breed}` : "")}
                        left={(props) => <Avatar.Image {...props} source={{ uri: animal.photo_url }} />}
                        right={
                            global.user?.id
                                ? (props) => (
                                    <IconButton
                                        {...props}
                                        icon={isBookmarked ? "bookmark" : "bookmark-outline"}
                                        color={isBookmarked ? "#ff9900" : "#888"}
                                        onPress={handleBookmark}
                                        accessibilityLabel={
                                            isBookmarked
                                                ? "Видалити із закладок"
                                                : "Додати до закладок"
                                        }
                                    />
                                )
                                : undefined
                        }
                    />
                    <Card.Content>
                        <Text style={{ marginBottom: 8 }}>
                            Вік: {animal.age || "?"} • Стать: {animal.sex === "male" ? "Ч" : "Ж"}
                        </Text>
                        <Text variant="bodyMedium">{animal.description}</Text>
                    </Card.Content>
                </Card>
                {/* Додаткові фото */}
                {extraPhotos.length > 0 && (
                    <View style={{ marginVertical: 10 }}>
                        <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Додаткові фото</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {extraPhotos.map((url, i) => (
                                <Pressable
                                    key={i}
                                    onPress={() => {
                                        setSelectedPhoto(url);
                                        setPhotoModalVisible(true);
                                    }}
                                    style={{ marginRight: 10 }}
                                >
                                    <Image
                                        source={{ uri: url }}
                                        style={{ width: 110, height: 110, borderRadius: 10, backgroundColor: "#eee" }}
                                    />
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Інформація про власника тваринки */}
                {owner && (
                    <Card style={styles.ownerCard} onPress={() => router.push(`/user/${owner.id}`)}>
                        <Card.Title
                            title={owner.name}
                            subtitle={
                                owner.email +
                                (owner.phone ? ` • ${owner.phone}` : "")
                            }
                            left={(props) =>
                                owner.avatar_url
                                    ? <Avatar.Image {...props} source={{ uri: owner.avatar_url }} />
                                    : <Avatar.Icon {...props} icon="account" />
                            }
                        />
                        <Card.Content>
                            <Text>
                                {owner.isBlocked
                                    ? <Text style={{ color: "red" }}>Користувач заблокований</Text>
                                    : "Власник оголошення"
                                }
                            </Text>
                        </Card.Content>
                        {/* Кнопка початку чату (не для власника) */}
                        {!isOwner && (
                            <Card.Actions>
                                <Button
                                    icon="message"
                                    mode="contained"
                                    onPress={handleStartChat}
                                    style={{ marginTop: 8 }}
                                >
                                    Написати власнику
                                </Button>
                            </Card.Actions>
                        )}
                    </Card>
                )}

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
                        style={{ marginTop: 16, backgroundColor: "#e53935" }}
                        onPress={handleDelete}
                    >
                        Видалити тваринку
                    </Button>
                )}
                <Button
                    style={{ marginTop: 16 }}
                    mode="outlined"
                    icon="arrow-left"
                    onPress={() => router.back()}
                >
                    Назад
                </Button>
            </ScrollView>
            <Portal>
                <Modal
                    visible={photoModalVisible}
                    onDismiss={() => setPhotoModalVisible(false)}
                    contentContainerStyle={styles.modalBackground}
                    dismissable={true}
                >
                    <Pressable
                        style={styles.modalBackground}
                        onPress={() => setPhotoModalVisible(false)}
                    >
                        <View style={styles.modalImageWrapper}>
                            {selectedPhoto && (
                                <Pressable onPress={() => setPhotoModalVisible(false)}>
                                    <Image
                                        source={{ uri: selectedPhoto }}
                                        style={styles.modalImage}
                                    />
                                </Pressable>
                            )}
                        </View>
                    </Pressable>
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, alignItems: "stretch", paddingBottom: 40 },
    card: { marginBottom: 24, borderRadius: 14, elevation: 2 },
    mainPhoto: { height: 200, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
    ownerCard: { marginBottom: 24, borderRadius: 14, elevation: 1, backgroundColor: "#fafafa" },
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
    modalBackground: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.97)",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        position: "absolute",
        left: 0,
        top: 0,
    },
    modalImageWrapper: {
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
    },
    modalImage: {
        width: Dimensions.get("window").width * 0.97,
        height: Dimensions.get("window").height * 0.8,
        resizeMode: "contain",
        borderRadius: 16,
        alignSelf: "center",
    },
});