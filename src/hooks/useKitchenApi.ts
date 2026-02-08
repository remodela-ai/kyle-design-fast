/**
 * React Query hooks for kitchen API operations.
 * These replace the tRPC hooks from the Manus project.
 * 
 * Usage:
 *   const { data: projects } = useProjects();
 *   const { data: project } = useProject(projectId);
 *   const createProject = useCreateProject();
 *   const uploadImage = useUploadProjectImage();
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/services/kitchenApi";

// ─── Query Keys ───

export const kitchenKeys = {
  all: ["kitchen"] as const,
  projects: () => [...kitchenKeys.all, "projects"] as const,
  project: (id: number) => [...kitchenKeys.all, "project", id] as const,
  catalog: () => [...kitchenKeys.all, "catalog"] as const,
};

// ─── Project Queries ───

export function useProjects() {
  return useQuery({
    queryKey: kitchenKeys.projects(),
    queryFn: api.getProjects,
  });
}

export function useProject(id: number, enabled = true) {
  return useQuery({
    queryKey: kitchenKeys.project(id),
    queryFn: () => api.getProject(id),
    enabled: id > 0 && enabled,
  });
}

export function useCatalogCategories() {
  return useQuery({
    queryKey: kitchenKeys.catalog(),
    queryFn: api.getCatalogCategories,
  });
}

// ─── Project Mutations ───

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.createProject(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kitchenKeys.projects() });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kitchenKeys.projects() });
    },
  });
}

// ─── Image Upload ───

export function useUploadProjectImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { projectId: number; imageBase64: string; mimeType: string }) =>
      api.uploadProjectImage(params.projectId, params.imageBase64, params.mimeType),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: kitchenKeys.project(variables.projectId) });
    },
  });
}

// ─── AI Segmentation ───

export function useSegmentDino() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: number) => api.segmentWithDino(projectId),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: kitchenKeys.project(projectId) });
    },
  });
}

export function useSegmentSSA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: number) => api.segmentWithSSA(projectId),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: kitchenKeys.project(projectId) });
    },
  });
}

export function useSegmentSAM() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: number) => api.segmentWithSAM(projectId),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: kitchenKeys.project(projectId) });
    },
  });
}

// ─── Product Selection ───

export function useSelectItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { projectId: number; categoryId: string; itemId: string }) =>
      api.selectItem(params.projectId, params.categoryId, params.itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: kitchenKeys.project(variables.projectId) });
    },
  });
}

export function useRemoveItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { projectId: number; categoryId: string }) =>
      api.removeItem(params.projectId, params.categoryId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: kitchenKeys.project(variables.projectId) });
    },
  });
}

// ─── AI Rendering ───

export function useRenderRedesign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: number) => api.renderRedesign(projectId),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: kitchenKeys.project(projectId) });
    },
  });
}

export function useSaveRenderResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { projectId: number; redesignImageUrl: string }) =>
      api.saveRenderResult(params.projectId, params.redesignImageUrl),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: kitchenKeys.project(variables.projectId) });
    },
  });
}

// ─── 3D Layout ───

export function useGenerate3DLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: number) => api.generate3DLayout(projectId),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: kitchenKeys.project(projectId) });
    },
  });
}

// ─── Proposal ───

export function useGenerateProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: number) => api.generateProposal(projectId),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: kitchenKeys.project(projectId) });
    },
  });
}
