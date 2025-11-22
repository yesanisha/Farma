// src/components/DiseaseCard.js
import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const DiseaseCard = ({ disease }) => {
  const navigation = useNavigation();
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("DiseaseDetail", { diseaseId: disease.disease_id })
      }
    >
      {/* Image preview with fallback */}
      <Image
        source={
          imageError || !disease.image_url
            ? require("../../assets/placeholder-plant.png")
            : { uri: disease.image_url }
        }
        style={styles.image}
        resizeMode="cover"
        onError={() => setImageError(true)}
      />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name}>{disease.disease_name}</Text>

        {/* Symptoms */}
        <View style={styles.row}>
          <Ionicons name="alert-circle-outline" size={14} color="#666" />
          <Text
            style={styles.symptom}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {disease.symptoms_description}
          </Text>
        </View>

        {/* Extra Info: severity + pathogen */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons
              name="pulse-outline"
              size={14}
              color={
                disease.severity_level === "High"
                  ? "red"
                  : disease.severity_level === "Medium"
                    ? "orange"
                    : "green"
              }
            />
            <Text style={styles.metaText}>{disease.severity_level}</Text>
          </View>

          {disease.pathogen_type ? (
            <View style={styles.metaItem}>
              <Ionicons name="bug-outline" size={14} color="#444" />
              <Text style={styles.metaText}>{disease.pathogen_type}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 6,
    overflow: "hidden",
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 120,
    backgroundColor: "#f0f0f0",
  },
  content: {
    padding: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#222",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  symptom: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  metaText: {
    fontSize: 12,
    color: "#444",
    marginLeft: 3,
  },
});

export default DiseaseCard;
