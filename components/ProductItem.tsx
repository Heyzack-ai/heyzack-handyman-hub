import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Image } from "expo-image";
import { Check, FileText } from "lucide-react-native";
import { Product } from "@/types/job";
import Colors from "@/constants/colors";
import ActionButton from "./ActionButton";

type ProductItemProps = {
  product: Product;
  onToggleCollected?: () => void;
  onToggleInstalled?: () => void;
  onViewDetails?: () => void;
  showCollectButton?: boolean;
  showInstallButton?: boolean;
};

export default function ProductItem({
  product,
  onToggleCollected,
  onToggleInstalled,
  onViewDetails,
  showCollectButton = false,
  showInstallButton = false,
}: ProductItemProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: product.image }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.info}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>
        </View>
      </View>

      <View style={styles.statusContainer}>
        {product.isCollected && (
          <View style={styles.statusBadge}>
            <Check size={12} color={Colors.light.success} />
            <Text style={[styles.statusText, { color: Colors.light.success }]}>
              Collected
            </Text>
          </View>
        )}
        {product.isInstalled && (
          <View style={styles.statusBadge}>
            <Check size={12} color={Colors.light.success} />
            <Text style={[styles.statusText, { color: Colors.light.success }]}>
              Installed
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {showCollectButton && (
          <ActionButton
            title={product.isCollected ? "Uncollect" : "Collect"}
            variant={product.isCollected ? "outline" : "primary"}
            size="small"
            onPress={onToggleCollected || (() => {})}
            style={styles.actionButton}
          />
        )}
        {showInstallButton && (
          <ActionButton
            title={product.isInstalled ? "Uninstall" : "Install"}
            variant={product.isInstalled ? "outline" : "primary"}
            size="small"
            onPress={onToggleInstalled || (() => {})}
            style={styles.actionButton}
            disabled={!product.isCollected}
          />
        )}
        {onViewDetails && (
          <Pressable
            style={styles.detailsButton}
            onPress={onViewDetails}
          >
            <FileText size={16} color={Colors.light.primary} />
            <Text style={styles.detailsText}>Details</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  header: {
    flexDirection: "row",
    marginBottom: 8,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: Colors.light.gray[200],
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.light.gray[600],
  },
  statusContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.success + "15",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    flexWrap: "wrap",
  },
  actionButton: {
    marginRight: 8,
    marginBottom: 4,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
  },
  detailsText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: "500",
    marginLeft: 4,
  },
});