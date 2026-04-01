import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { Alert, Linking, Platform } from "react-native";

export const requestMediaLibraryPermissions = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Permission Required",
      "We need access to your gallery to upload images.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  }
  return true;
};

export const requestStoragePermissions = async (): Promise<boolean> => {
  if (Platform.OS === "web") return true;
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Permission Required", "We need storage permissions.", [
      { text: "Cancel", style: "cancel" },
      { text: "Open Settings", onPress: () => Linking.openSettings() },
    ]);
    return false;
  }
  return true;
};
