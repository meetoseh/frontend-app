import { StyleSheet } from "react-native";
import * as Colors from '../../styling/colors';

export const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingLeft: 32,
        paddingRight: 32,
    },
    label: {
        color: Colors.WHITE,
        fontFamily: "OpenSans-Regular",
        fontSize: 12,
        letterSpacing: 0.15,
        lineHeight: 22,
        width: "100%",
    },
    input: {
        color: Colors.WHITE,
        fontFamily: "OpenSans-Regular",
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: 0.25,
        width: "100%",
        paddingTop: 5,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: Colors.WHITE,
    }
});