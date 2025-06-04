import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Job, JobStatus, Product } from "@/types/job";
import { jobs as mockJobs } from "@/mocks/jobs";

interface JobState {
  jobs: Job[];
  currentJobId: string | null;
  
  // Actions
  setCurrentJobId: (id: string | null) => void;
  getCurrentJob: () => Job | undefined;
  updateJobStatus: (jobId: string, status: JobStatus) => void;
  updateProductCollectionStatus: (jobId: string, productId: string, isCollected: boolean) => void;
  updateProductInstallationStatus: (jobId: string, productId: string, isInstalled: boolean) => void;
  addInstallationPhoto: (jobId: string, photoUri: string) => void;
  sendContract: (jobId: string) => void;
  addJobNote: (jobId: string, note: string) => void;
}

export const useJobStore = create<JobState>()(
  persist(
    (set, get) => ({
      jobs: mockJobs,
      currentJobId: null,
      
      setCurrentJobId: (id) => set({ currentJobId: id }),
      
      getCurrentJob: () => {
        const { jobs, currentJobId } = get();
        return jobs.find(job => job.id === currentJobId);
      },
      
      updateJobStatus: (jobId, status) => set(state => ({
        jobs: state.jobs.map(job => 
          job.id === jobId ? { ...job, status } : job
        )
      })),
      
      updateProductCollectionStatus: (jobId, productId, isCollected) => set(state => ({
        jobs: state.jobs.map(job => 
          job.id === jobId 
            ? { 
                ...job, 
                products: job.products.map(product => 
                  product.id === productId 
                    ? { ...product, isCollected } 
                    : product
                ) 
              } 
            : job
        )
      })),
      
      updateProductInstallationStatus: (jobId, productId, isInstalled) => set(state => ({
        jobs: state.jobs.map(job => 
          job.id === jobId 
            ? { 
                ...job, 
                products: job.products.map(product => 
                  product.id === productId 
                    ? { ...product, isInstalled } 
                    : product
                ) 
              } 
            : job
        )
      })),
      
      addInstallationPhoto: (jobId, photoUri) => set(state => ({
        jobs: state.jobs.map(job => 
          job.id === jobId 
            ? { 
                ...job, 
                installationPhotos: [...(job.installationPhotos || []), photoUri] 
              } 
            : job
        )
      })),
      
      sendContract: (jobId) => set(state => ({
        jobs: state.jobs.map(job => 
          job.id === jobId ? { ...job, contractSent: true } : job
        )
      })),
      
      addJobNote: (jobId, note) => set(state => ({
        jobs: state.jobs.map(job => 
          job.id === jobId 
            ? { 
                ...job, 
                notes: [...(job.notes || []), note] 
              } 
            : job
        )
      })),
    }),
    {
      name: "job-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);