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
import { Job, JobStatus } from "@/types/job";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import ShimmerSkeleton from "@/components/ShimmerSkeleton";
import { useGetPartnerById } from "@/app/api/user/getPartner";
import { useGetJobById } from "@/app/api/jobs/getJobs";
import { useGetPendingJobs } from "@/app/api/jobs/getJobs";
import { useUpdateJobStatus } from "@/app/api/jobs/updateStatus";
import { useUpdateCompletionPhoto } from "@/app/api/jobs/getCompletionPhoto";
import { useGetProduct } from "@/app/api/products/getProduct";
import { useTranslations } from "@/src/i18n/useTranslations";
import { useSendContract } from "@/app/api/jobs/sendContract";
import { QueryClient } from "@tanstack/react-query";
// Product Item Component that fetches its own data
const ProductItem = ({ product }: { product: any }) => {
  // const { data: productData } = useGetProduct(product.item);

  console.log("Product:", product);
  
  return (
    <View key={product.name} style={styles.productItem}>
      <View>
        <Text style={styles.productName}>{product.productName || `Item ${product.item}`}</Text>
        <Text style={styles.productRequired}>Required: {product.quantity}</Text>
      </View>
      <View
        style={[
          styles.statusBadge,
          product.status === "collected"
            ? styles.availableBadge
            : styles.shortBadge,
        ]}
      >
        <Text
          style={
            product.status === "collected"
              ? styles.availableText
              : styles.shortText
          }
        >
          {product.status === "pending" ? "To Collect" : "Collected"}
        </Text>
      </View>
    </View>
  );
};

export default function JobDetailScreen() {
  const params = useLocalSearchParams<{ job: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [productsExpanded, setProductsExpanded] = useState(true);
  const [completionExpanded, setCompletionExpanded] = useState(false);
  const [jobData, setJobData] = useState<Job | undefined>(undefined);
  
  const { data: jobDetails, isLoading: isJobDetailsLoading } = useGetJobById(jobData?.name || '');
  const { data: pendingJobs } = useGetPendingJobs();
  const { mutate: updateJobStatusMutation } = useUpdateJobStatus();
  const IMAGE_URL = process.env.EXPO_PUBLIC_ASSET_URL;
  const { mutate: updateCompletionPhotoMutation } = useUpdateCompletionPhoto();
  const { t } = useTranslations();
  const { mutate: sendContractMutation } = useSendContract();
  const queryClient = new QueryClient();

  // console.log("Job details:", jobData?.installation);
  console.log("Products:", jobDetails?.installation);
// 
  // // Debug completion photos data
  // console.log("Completion photos:", jobData?.products);
  // console.log("Pending jobs:", jobDetails?.data?.products);

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
        Alert.alert(t("jobDetails.error"), t("jobDetails.invalidJobData"));
        router.back();
      }
    }
  }, [params.job, router]);

  // Use the parsed job data
  const job = jobData;
  // console.log("Job:", job);

  // Redirect if job is not found or is pending
  useEffect(() => {
    if (!job) {
      return;
    }

    if (job.status === "pending") {
      Alert.alert(
        t("jobDetails.accessDenied"),
        t("jobDetails.accessDeniedText")
      );
      router.back();
    }
  }, [job, router]);

  if (!job) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title={t("jobDetails.jobDetails")} onBack={() => router.back()} />
        <ShimmerSkeleton />
      </SafeAreaView>
    );
  }

  // Show shimmer while job details are loading
  if (isJobDetailsLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title={job.title} onBack={() => router.back()} />
        <ShimmerSkeleton />
      </SafeAreaView>
    );
  }

  if (job.status === "pending") {
    return null;
  }

  const getProgressPercentage = () => {
    const statusOrder = [
      "job_request",
      "accepted",
      "stock_collected",   
      "en_route", 
      "contract_sent",
      "contract_signed",
      "job_started",
      "job_completed",
      "job_approved",
    ];
    const currentIndex = statusOrder.indexOf(job.status);
    return ((currentIndex + 1) / statusOrder.length) * 100;
  };

  const getStatusText = () => {
    switch (job.status) {
      case "job_request":
        return "Job Request";
      case "accepted":
        return "Accepted";
      case "stock_collected":
        return "Stock Collected";
      case "en_route": 
        return "En Route";
      case "contract_sent":
        return "Contract Sent";
      case "contract_signed":
        return "Contract Signed";
      case "job_started":
        return "Job Started";
      case "job_completed":
        return "Job Completed";
      case "job_approved":
        return "Job Approved";
      default:
        return "Accepted";
    }
  };

  const handleCall = (phone: string) => {
    if (Platform.OS !== "web") {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert(t("jobDetails.phoneCall"), t("jobDetails.call", { phone }));
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
      sendContractMutation({ jobId: job.name || "" });
      queryClient.invalidateQueries({ queryKey: ["get-jobs", job.name] });
      Alert.alert(t("jobDetails.success"), t("jobDetails.contractSentToCustomer"));
      setIsLoading(false);
    }, 1000);
  };

  const handleCollectStock = () => {
    console.log("handleCollectStock called");
    console.log("job.id:", job.id);
    console.log("job.name:", job.name);
    console.log("jobData?.name:", jobData?.name);
    console.log("jobDetails?.data?.name:", jobDetails?.data?.name);
    
    router.push({
      pathname: "/jobs/collect-stock/collect",
      params: {
        jobId: job.name || jobData?.name || job.id,
        products: JSON.stringify(jobDetails?.installation?.products || []),
        item_name: job.title || "Product Collection",
      },
    });
  };

  const handleTakePhoto = async () => {
    console.log("handleTakePhoto called");
    console.log("Platform:", Platform.OS);
    
    // Check if we're on web platform
    if (Platform.OS === 'web') {
      Alert.alert("Not Supported", "Camera functionality is not available on web platform");
      return;
    }
    
    // Show options dialog
    Alert.alert(
      t("jobDetails.selectPhoto"),
      t("jobDetails.chooseHowToAddPhotos"),
      [
        {
          text: "Camera",
          onPress: () => handleCameraCapture(),
        },
        {
          text: "Gallery (Multiple)",
          onPress: () => handleGalleryPick(),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const handleCameraCapture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log("Camera permission status:", status);

      if (status !== "granted") {
        Alert.alert(
          t("jobDetails.permissionRequired"),
          t("jobDetails.cameraPermissionNeeded")
        );
        return;
      }

      console.log("Launching camera...");
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
      });
      
      console.log("Camera result:", result);
      handleImageResult(result);
    } catch (error) {
      console.error("Error in handleCameraCapture:", error);
      Alert.alert(t("jobDetails.error"), t("jobDetails.failedToOpenCamera"));
    }
  };

  const handleGalleryPick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("Gallery permission status:", status);

      if (status !== "granted") {
        Alert.alert(
          t("jobDetails.permissionRequired"),
          t("jobDetails.galleryPermissionNeeded")
        );
        return;
      }

      console.log("Launching gallery...");
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.8,
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: 10, // Allow up to 10 images
      });
      
      console.log("Gallery result:", result);
      handleImageResult(result);
    } catch (error) {
      console.error("Error in handleGalleryPick:", error);
      Alert.alert(t("jobDetails.error"), t("jobDetails.failedToOpenGallery"));
    }
  };

  const handleImageResult = async (result: any) => {
    if (!result.canceled && result.assets && result.assets.length > 0) {
      console.log(`Processing ${result.assets.length} images`);
      
      try {
        // Get current completion photos from job data
        let currentCompletionPhotos = jobData?.completion_photos || [];
        
        // Process each image individually
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < result.assets.length; i++) {
          const asset = result.assets[i];
          const imageUri = asset.uri;
          console.log(`Processing image ${i + 1}/${result.assets.length}:`, imageUri);
          
          try {
            await new Promise((resolve, reject) => {
              updateCompletionPhotoMutation({
                jobId: jobData?.name || '',
                completion_photos: currentCompletionPhotos as any,
                fileUri: imageUri
              }, {
                onSuccess: (updatedJob: any) => {
                  console.log(`Successfully uploaded image ${i + 1}`);
                  successCount++;
                  // Update the current completion photos with the new data from the response
                  if (updatedJob?.completion_photos) {
                    currentCompletionPhotos = updatedJob.completion_photos;
                    console.log(`Updated completion_photos array now has ${currentCompletionPhotos.length} items`);
                  }
                  resolve(true);
                },
                onError: (error) => {
                  console.error(`Failed to upload image ${i + 1}:`, error);
                  errorCount++;
                  reject(error);
                }
              });
            });
          } catch (error) {
            console.error(`Error uploading image ${i + 1}:`, error);
            errorCount++;
          }
        }
        
        // Show final result
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        if (errorCount === 0) {
          Alert.alert(t("jobDetails.success"), t("jobDetails.photosUploadedSuccessfully", { count: successCount }));
        } else if (successCount > 0) {
          Alert.alert(t("jobDetails.partialSuccess"), t("jobDetails.photosUploadedFailed", { count: successCount, errorCount }));
        } else {
          Alert.alert(t("jobDetails.error"), t("jobDetails.allPhotosFailedToUpload"));
        }
        
      } catch (error) {
        console.error("Error processing multiple images:", error);
        Alert.alert(t("jobDetails.error"), t("jobDetails.failedToProcessImages"));
      }
    } else {
      console.log("Image selection was canceled or no assets");
    }
  };

  const handleMarkComplete = () => {
    Alert.alert(
      t("jobDetails.completeJob"),
      t("jobDetails.completeJobConfirmation"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("jobDetails.complete"),
          onPress: () => {
            updateJobStatusMutation({ jobId: job.id, status: "Job Marked as Done" });
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
          <Text style={styles.sectionTitle}>{t("jobDetails.jobProgress")}</Text>
          <Text style={styles.statusText}>
            {t("jobDetails.currentStatus")}: {getStatusText()}
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
              <Text style={styles.primaryButtonText}>{t("jobDetails.collectStock")}</Text>
            </Pressable>
          )}
        </View>

        {/* Schedule Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("jobDetails.scheduleDetails")}</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("jobDetails.date")}:</Text>
            <Text style={styles.detailValue}>{formattedDate}</Text>
          </View>

          <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t("jobDetails.time")}:</Text>
            <Text style={styles.detailValue}>{formattedTime}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("jobDetails.duration")}:</Text>
            <Text style={styles.detailValue}>{job.duration}</Text>
          </View>

          <View style={[styles.detailRow, {alignItems: "flex-start"}]}>
            <Text style={styles.detailLabel}>{t("jobDetails.type")}:</Text>
            <Text
              style={[styles.detailValue, styles.detailValueMultiline]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {job.title}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("jobDetails.status")}:</Text>
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
          <Text style={styles.cardTitle}>{t("jobDetails.partnerDetails")}</Text>
          <Text style={styles.companyName}>{jobData?.installation?.partner.partnerName}</Text>

          <ContactRow
            icon={<Phone size={20} color={Colors.light.gray[600]} />}
            text={jobData?.installation?.partner.phone || ""}
            onPress={() => handleCall(jobData?.installation?.partner.phone || "")}
            buttonColor="#4CD964"
          />

          <ContactRow
            icon={<Mail size={20} color={Colors.light.black} />}
            text={jobData?.installation?.partner.email || ""}
            onPress={() => handleEmail(jobData?.installation?.partner.email || "")}
            buttonColor="#4CD964"
          />

          <ContactRow
            icon={<MapPin size={20} color={Colors.light.gray[600]} />}
            text={jobData?.installation?.partner.address || ""}
            onPress={() => handleNavigate(jobData?.installation?.partner.address || "")}
            buttonColor="#FF2D55"
          />
        </View>

        {/* Products (Bill Of Materials) */}
        <View style={styles.card}>
          <Pressable
            style={styles.expandableHeader}
            onPress={() => setProductsExpanded(!productsExpanded)}
          >
            <Text style={styles.cardTitle}>{t("jobDetails.products")}</Text>
            {productsExpanded ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </Pressable>

          {productsExpanded && (
            <>
              {Array.isArray(jobData?.installation?.products) && jobData?.installation?.products.map((product: any) => (
             
                <ProductItem key={product.inventoryItemId} product={product} />
              ))}

              <View style={styles.productActions}>
                <Pressable
                  style={styles.outlineButton}
                  onPress={handleCollectStock}
                >
                  <Package size={16} color={Colors.light.text} />
                  <Text style={styles.outlineButtonText}>{t("jobDetails.collectStock")}</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>

        {/* Customer Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("jobDetails.customerInformation")}</Text>
          <Text style={styles.customerName}>{job.customer.customer_name}</Text>

          <ContactRow
            icon={<Phone size={20} color={Colors.light.gray[600]} />}
            text={job.customer.phone}
            onPress={() => handleCall(job.customer.phone)}
            buttonColor="#4CD964"
          />

          <ContactRow
            icon={<Mail size={20} color={Colors.light.gray[600]} />}
            text={job?.customer?.email}
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
          <Text style={styles.cardTitle}>{t("jobDetails.contractStatus")}</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("jobDetails.status")}:</Text>
            <StatusBadge
              status={job.status === "contract_sent" ? "sent" : "not_sent"}
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
                {t("jobDetails.sendContractToCustomer")}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Job Completion */}
        <View style={styles.card}>
          <View style={styles.expandableHeader}>
            <Text style={styles.cardTitle}>{t("jobDetails.jobCompletion")}</Text>
          </View>

          {jobDetails?.data?.completion_photos && jobDetails?.data?.completion_photos.length > 0 ? (
            <View style={styles.photosList}>
              <Text style={styles.photosTitle}>
                {t("jobDetails.photoCount", { count: jobDetails?.data?.completion_photos?.length })} uploaded
                
              </Text>
              <View style={styles.photosContainer}>
                <FlatList
                  data={jobDetails?.data?.completion_photos}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, index) => index.toString()}
                  key={job.title}
                 
                  renderItem={({ item }: { item: any }) => {
                    // Check if item.image already contains a full URL
                    const imageUrl = item.image?.startsWith('http') 
                      ? item.image 
                      : `${IMAGE_URL}${item.image}`;
                    
                    return (
                      <Image 
                        source={{ uri: imageUrl || 'https://placehold.co/600x400' }} 
                        style={styles.photo}
                        contentFit="cover"
                        onError={() => console.warn("Failed to load image:", imageUrl)}
                      />
                    );
                  }}
                />
              </View>
            </View>
          ) : (
              <Text style={styles.noPhotosText}>{t("jobDetails.noPhotosUploaded")}</Text>
          )}

          <Pressable 
            style={styles.uploadButton} 
            onPress={() => {
              console.log("Upload button pressed");
              handleTakePhoto();
            }}
          >
            <Camera size={20} color={Colors.light.primary} />
            <Text style={styles.uploadButtonText}>{t("jobDetails.addPhoto")}</Text>
          </Pressable>
        </View>

        {/* Mark as Complete Button */}
        {jobDetails?.data?.completion_photos && jobDetails?.data?.completion_photos.length > 0 && (
          <Pressable style={styles.completeButton} onPress={handleMarkComplete}>
              <Text style={styles.completeButtonText}>{t("jobDetails.markAsComplete")}</Text>
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
  detailValueMultiline: {
    flexShrink: 1,
    maxWidth: '70%',
    alignItems: 'flex-end',
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
    width: 100,
    height: 100,
    marginRight: 8,
    borderRadius: 8,
  },
  photosContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});
