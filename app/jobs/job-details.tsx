import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  SafeAreaView,
  Linking,
  StatusBar,
  FlatList,
} from "react-native";
import { Image } from "expo-image";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Camera,
  CheckCircle,
  Package,
  Truck,
  Check,
  ChevronUp,
  ChevronDown,
  Book,
  FileText,
} from "lucide-react-native";
import { useJobStore } from "@/store/job-store";
import Colors from "@/constants/colors";
import { Job } from "@/types/job";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import { useGetPartnerById } from "@/app/api/user/getPartner";
import { useGetJobById } from "@/app/api/jobs/getJobs";
import { useGetPendingJobs } from "@/app/api/jobs/getJobs";
export default function JobDetailScreen() {
  const params = useLocalSearchParams<{ job: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [productsExpanded, setProductsExpanded] = useState(true);
  const [completionExpanded, setCompletionExpanded] = useState(false);
  const [jobData, setJobData] = useState<Job | undefined>(undefined);
  const { data: partnerData } = useGetPartnerById(jobData?.partner as string);
  const { data: jobDetails } = useGetJobById(jobData?.name || '');
  const { data: pendingJobs } = useGetPendingJobs();
  const IMAGE_URL = process.env.EXPO_PUBLIC_ASSET_URL;

  // Debug completion photos data
  console.log("Completion photos:", jobDetails?.data?.completion_photos);
  console.log("Pending jobs:", pendingJobs);
  // console.log("Job data from job-details:", jobData?.partner);
  // console.log("Partner data from job-details:", jobData);

  let formattedDate = '';
  let formattedTime = '';
  if (jobData?.scheduled_date) {
    const dateObj = new Date(jobData.scheduled_date.replace(' ', 'T'));
    formattedDate = dateObj.toLocaleDateString();
    formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const {
    jobs,
    getCurrentJob,
    setCurrentJobId,
    updateJobStatus,
    addInstallationPhoto,
    sendContract,
  } = useJobStore();

  useEffect(() => {
    // Parse the job from params
    if (params.job) {
      try {
        const parsedJob = JSON.parse(params.job as string) as Job;
        
        // Parse products if it's a string
        if (typeof parsedJob.products === 'string') {
          parsedJob.products = JSON.parse(parsedJob.products);
        }
        
        setJobData(parsedJob);
      } catch (error) {
        console.error('Failed to parse job data:', error);
        Alert.alert("Error", "Invalid job data");
        router.back();
      }
    }
  }, [params.job, router]);

  // Use the parsed job data
  const job = jobData;


  // Redirect if job is not found or is pending
  useEffect(() => {
    if (!job) {
      return;
    }

    if (job.status === "pending") {
      Alert.alert(
        "Access Denied",
        "You must accept the job request before viewing details"
      );
      router.back();
    }
  }, [job, router]);

  if (!job) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.loadingText}>Loading job details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (job.status === "pending") {
    return null;
  }

  const getProgressPercentage = () => {
    const statusOrder = [
      "scheduled",
      "stock_collected",
      "en_route",
      "started",
      "completed",
    ];
    const currentIndex = statusOrder.indexOf(job.status);
    return ((currentIndex + 1) / statusOrder.length) * 100;
  };

  const getStatusText = () => {
    switch (job.status) {
      case "scheduled":
        return "Accepted";
      case "stock_collected":
        return "Stock Collected";
      case "en_route":
        return "En Route";
      case "started":
        return "Started";
      case "completed":
        return "Completed";
      default:
        return "Accepted";
    }
  };

  const handleCall = (phone: string) => {
    if (Platform.OS !== "web") {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert("Phone Call", `Call ${phone}`);
    }
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleNavigate = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps:?q=${encodedAddress}`,
      android: `geo:0,0?q=${encodedAddress}`,
      web: `https://maps.google.com/?q=${encodedAddress}`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const handleSendContract = async () => {
    setIsLoading(true);
    setTimeout(() => {
      sendContract(job.id);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Success", "Contract sent to customer");
      setIsLoading(false);
    }, 1000);
  };

  const handleCollectStock = () => {
    router.push({
      pathname: "/jobs/collect-stock/collect",
      params: {
        products: JSON.stringify(job.products),
      },
    });
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera permission is needed to take photos"
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      addInstallationPhoto(job.id, result.assets[0].uri);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  const handleMarkComplete = () => {
    Alert.alert(
      "Complete Job",
      "Are you sure you want to mark this job as complete?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: () => {
            updateJobStatus(job.id, "completed");
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            }
          },
        },
      ]
    );
  };

  const handleGoBack = () => {
    router.back();
  };

  const ContactRow = ({
    icon,
    text,
    onPress,
    buttonColor = "#4CD964",
  }: {
    icon: React.ReactNode;
    text: string;
    onPress: () => void;
    buttonColor?: string;
  }) => {
    // Create a clone of the icon with white color for the button
    const buttonIcon = React.cloneElement(
      icon as React.ReactElement<{ color?: string }>,
      {
        color: "white",
      }
    );

    return (
      <View style={styles.contactRow}>
        <View style={styles.contactInfo}>
          {icon}
          <Text style={styles.contactText}>{text}</Text>
        </View>
        <Pressable
          style={[styles.contactButton, { backgroundColor: buttonColor }]}
          onPress={onPress}
        >
          {buttonIcon}
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title={job.title} onBack={() => router.back()} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Job Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Progress</Text>
          <Text style={styles.statusText}>
            Current Status: {getStatusText()}
          </Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${getProgressPercentage()}%` },
                ]}
              />
            </View>
            <Text style={styles.progressPercentage}>
              {Math.round(getProgressPercentage())}%
            </Text>
          </View>

          <Text style={styles.workflowText}>
            Job Request → Accepted → Stock Collected → En Route → Contract Sent
            → Contract Signed → Job Started → Job Marked as Done → Job Ended
          </Text>

          {job.status === "scheduled" && (
            <Pressable
              style={styles.primaryButton}
              onPress={handleCollectStock}
            >
              <Text style={styles.primaryButtonText}>Collect Stock</Text>
            </Pressable>
          )}
        </View>

        {/* Schedule Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Schedule Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formattedDate}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{formattedTime}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{job.duration}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>{job.title}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            {/* <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1).toLowerCase()}
              </Text>
            </View> */}
            <StatusBadge status={job.status} size="medium" />
          </View>
        </View>

        {/* Partner Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Partner Details</Text>
          <Text style={styles.companyName}>{partnerData?.partner_name}</Text>

          <ContactRow
            icon={<Phone size={20} color={Colors.light.gray[600]} />}
            text={partnerData?.phone || ""}
            onPress={() => handleCall(partnerData?.phone || "")}
            buttonColor="#4CD964"
          />

          <ContactRow
            icon={<Mail size={20} color={Colors.light.black} />}
            text={partnerData?.email || ""}
            onPress={() => handleEmail(partnerData?.email || "")}
            buttonColor="#4CD964"
          />

          <ContactRow
            icon={<MapPin size={20} color={Colors.light.gray[600]} />}
            text={partnerData?.address || ""}
            onPress={() => handleNavigate(partnerData?.address || "")}
            buttonColor="#FF2D55"
          />
        </View>

        {/* Products (Bill Of Materials) */}
        <View style={styles.card}>
          <Pressable
            style={styles.expandableHeader}
            onPress={() => setProductsExpanded(!productsExpanded)}
          >
            <Text style={styles.cardTitle}>Products (Bill Of Materials)</Text>
            {productsExpanded ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </Pressable>

          {productsExpanded && (
            <>
              {Array.isArray(job.products) && job.products.map((product: any) => (
                <View key={product.id} style={styles.productItem}>
                  <View>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productRequired}>Required: 1</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      product.isCollected
                        ? styles.availableBadge
                        : styles.shortBadge,
                    ]}
                  >
                    <Text
                      style={
                        product.isCollected
                          ? styles.availableText
                          : styles.shortText
                      }
                    >
                      {product.isCollected === true ? "Collected" : "To Collect"}
                    </Text>
                  </View>
                </View>
              ))}

              <View style={styles.productActions}>
                <Pressable
                  style={styles.outlineButton}
                  onPress={handleCollectStock}
                >
                  <Package size={16} color={Colors.light.text} />
                  <Text style={styles.outlineButtonText}>Collect Stock</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>

        {/* Customer Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Information</Text>
          <Text style={styles.customerName}>{job.customer.customer_name}</Text>

          <ContactRow
            icon={<Phone size={20} color={Colors.light.gray[600]} />}
            text={job.customer.phone}
            onPress={() => handleCall(job.customer.phone)}
            buttonColor="#4CD964"
          />

          <ContactRow
            icon={<Mail size={20} color={Colors.light.gray[600]} />}
            text={job.customer.email}
            onPress={() => handleEmail(job.customer.email)}
            buttonColor="#4CD964"
          />

          <ContactRow
            icon={<MapPin size={20} color={Colors.light.gray[600]} />}
            text={job.customer.address}
            onPress={() => handleNavigate(job.customer.address)}
            buttonColor="#FF2D55"
          />
        </View>

        {/* Contract Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contract Status</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <StatusBadge
              status={job.contractsent === true ? "sent" : "not_sent"}
              size="medium"
            />
          </View>

          {job.contractsent !== true && (
            <Pressable
              style={styles.contractButton}
              onPress={handleSendContract}
            >
              <FileText size={16} color={Colors.light.text} />
              <Text style={styles.contractButtonText}>
                Send Contract to Customer
              </Text>
            </Pressable>
          )}
        </View>

        {/* Job Completion */}
        <View style={styles.card}>
          <View style={styles.expandableHeader}>
            <Text style={styles.cardTitle}>Job Completion</Text>
          </View>

          {jobDetails?.data?.completion_photos && jobDetails?.data?.completion_photos.length > 0 ? (
            <View style={styles.photosList}>
              <Text style={styles.photosTitle}>
                {jobDetails?.data?.completion_photos?.length} photo(s) uploaded
                
              </Text>
              <View style={styles.photosContainer}>
                <FlatList
                  data={jobDetails?.data?.completion_photos}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, index) => index.toString()}
                 
                  renderItem={({ item }: { item: any }) => (
                   
                    <Image 
                      source={{ uri: `${IMAGE_URL}${item.image}` || 'https://placehold.co/600x400' }} 
                      style={styles.photo}
                      contentFit="cover"
                      onError={() => console.warn("Failed to load image:", `${IMAGE_URL}${item.image}`)}
                    />
                   
                  )}
                />
              </View>
            </View>
          ) : (
            <Text style={styles.noPhotosText}>No photos uploaded yet</Text>
          )}

          <Pressable style={styles.uploadButton} onPress={handleTakePhoto}>
            <Camera size={20} color={Colors.light.primary} />
            <Text style={styles.uploadButtonText}>Upload Photos</Text>
          </Pressable>
        </View>

        {/* Mark as Complete Button */}
        {jobDetails?.data?.completion_photos && jobDetails?.data?.completion_photos.length > 0 && (
          <Pressable style={styles.completeButton} onPress={handleMarkComplete}>
            <Text style={styles.completeButtonText}>Mark as Complete</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    marginTop: 16,
  },
  headerButton: {
    padding: 8,
  },
  section: {
    marginBottom: 24,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.light.gray[200],
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FF2D55",
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  workflowText: {
    fontSize: 12,
    color: Colors.light.gray[600],
    marginBottom: 20,
    lineHeight: 16,
  },
  primaryButton: {
    backgroundColor: "#000000",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: Colors.light.text,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  priorityBadge: {
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  priorityText: {
    color: "#D32F2F",
    fontSize: 12,
    fontWeight: "600",
  },
  companyName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 16,
  },
  customerName: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  contactText: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 12,
    width: "80%",
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  expandableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  productItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  productRequired: {
    fontSize: 14,
    color: Colors.light.gray[600],
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  availableBadge: {
    backgroundColor: "#E8F5E8",
  },
  shortBadge: {
    backgroundColor: "#FFEBEE",
  },
  availableText: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "600",
  },
  shortText: {
    color: "#D32F2F",
    fontSize: 12,
    fontWeight: "600",
  },
  productActions: {
    flexDirection: "row",
    gap: 12,
  },
  outlineButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  outlineButtonText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 8,
  },
  contractStatus: {
    fontSize: 16,
    color: Colors.light.gray[600],
  },
  contractButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 12,
  },
  contractButtonText: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 8,
  },
  photosList: {
    marginBottom: 12,
  },
  photosTitle: {
    fontSize: 14,
    color: Colors.light.gray[600],
  },
  noPhotosText: {
    fontSize: 14,
    color: Colors.light.gray[600],
    marginBottom: 12,
    textAlign: "center",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    color: Colors.light.primary,
    marginLeft: 8,
  },
  completeButton: {
    backgroundColor: "#000000",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  completeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingText: {
    fontSize: 18,
    color: Colors.light.text,
    textAlign: "center",
    marginTop: 20,
  },
  header: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  backButton: {
    padding: 8,
    marginLeft: -4,
  },
  photo: {
    marginTop: 10,
    width: '100%',
    height: '100%',
    marginRight: 8,
    borderRadius: 8,
  },
  photosContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});
