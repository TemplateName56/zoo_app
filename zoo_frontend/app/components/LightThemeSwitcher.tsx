import React, { useEffect, useState } from "react";
import { LightSensor } from "expo-sensors";
import { Provider as PaperProvider, DefaultTheme, MD3DarkTheme, MD3Theme } from "react-native-paper";

const CustomDarkTheme: MD3Theme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        background: "#111112",         // головний фон (майже чорний)
        surface: "#18181A",            // поверхня (модалки, меню)
        elevation: {
            ...MD3DarkTheme.colors.elevation,
            level0: "#111112",         // базовий фон
            level1: "#222228",         // картки (card) - трохи світліші за фон
            level2: "#232326",         // ще трохи світліше - для підняття елементів
            level3: "#29292C",
            level4: "#2F2F33",
            level5: "#35353A",
        },
        onBackground: "#E1E1E1",       // основний текст
        onSurface: "#E1E1E1",          // текст на поверхні/картках
        onSurfaceVariant: "#B0B0B0",   // допоміжний текст
        // @ts-ignore
        text: "#E1E1E1",               // для сумісності зі старими компонентами
        outline: "#353535",            // контур кнопок, інпутів
    },
};

export default function LightThemeSwitcher({ children }: { children: React.ReactNode }) {
    const [lux, setLux] = useState(100);
    const [theme, setTheme] = useState(DefaultTheme);

    useEffect(() => {
        let subscription = LightSensor.addListener(data => {
            setLux(data.illuminance ?? 0);
        });
        LightSensor.setUpdateInterval(1000);
        return () => subscription && subscription.remove();
    }, []);

    useEffect(() => {
        setTheme(lux < 3000 ? CustomDarkTheme : DefaultTheme);
        console.log(lux);
    }, [lux]);

    return (
        <PaperProvider theme={theme}>
            {children}
        </PaperProvider>
    );
}