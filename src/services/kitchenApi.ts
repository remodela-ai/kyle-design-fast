/**
 * Kitchen API Service Layer
 * 
 * This module provides Supabase-backed equivalents of the tRPC procedures
 * from the Manus kitchen-redesign-app. Each function maps to a tRPC call.
 * 
 * MIGRATION NOTE: These functions use Supabase Edge Functions for AI operations
 * (segmentation, rendering) and direct Supabase client for CRUD.
 * 
 * To complete the backend setup, you need to:
 * 1. Create the Supabase tables (see kitchenSchema.sql)
 * 2. Deploy the Edge Functions for AI operations
 * 3. Configure the Replicate API key in Supabase secrets
 */

import { supabase } from "@/integrations/supabase/client";

// ─── Types ───

export interface Project {
  id: number;
  name: string;
  status: "upload" | "segmenting" | "segmented" | "rendering" | "rendered";
  original_image_url: string | null;
  redesign_image_url: string | null;
  segmentation_data: any;
  items: ProjectItem[];
  created_at: string;
  updated_at: string;
}

export interface ProjectItem {
  category: string;
  catalogItemId: string;
  productName: string;
  productImageUrl: string;
  price: number;
}

export interface CatalogCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  items: CatalogItem[];
}

export interface CatalogItem {
  id: string;
  name: string;
  brand: string;
  material: string;
  price: number;
  imageUrl: string;
}

// ─── Project CRUD ───

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("kitchen_projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapProject);
}

export async function getProject(id: number): Promise<Project | null> {
  const { data, error } = await supabase
    .from("kitchen_projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data ? mapProject(data) : null;
}

export async function createProject(name: string): Promise<Project> {
  const { data, error } = await supabase
    .from("kitchen_projects")
    .insert({ name, status: "upload" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapProject(data);
}

export async function deleteProject(id: number): Promise<void> {
  const { error } = await supabase
    .from("kitchen_projects")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

// ─── Image Upload ───

export async function uploadProjectImage(
  projectId: number,
  imageBase64: string,
  mimeType: string
): Promise<{ imageUrl: string }> {
  const ext = mimeType.split("/")[1] || "jpg";
  const fileName = `kitchen-${projectId}-${Date.now()}.${ext}`;
  const filePath = `kitchen-projects/${fileName}`;

  // Decode base64 to blob
  const byteString = atob(imageBase64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: mimeType });

  const { error: uploadError } = await supabase.storage
    .from("kitchen-images")
    .upload(filePath, blob, { contentType: mimeType });

  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData } = supabase.storage
    .from("kitchen-images")
    .getPublicUrl(filePath);

  const imageUrl = urlData.publicUrl;

  // Update project with the image URL
  const { error: updateError } = await supabase
    .from("kitchen_projects")
    .update({ original_image_url: imageUrl, status: "upload" })
    .eq("id", projectId);

  if (updateError) throw new Error(updateError.message);

  return { imageUrl };
}

// ─── AI Segmentation (via Edge Functions) ───

export async function segmentWithDino(projectId: number): Promise<void> {
  // Update status to segmenting
  await supabase
    .from("kitchen_projects")
    .update({ status: "segmenting" })
    .eq("id", projectId);

  const { data, error } = await supabase.functions.invoke("kitchen-segment", {
    body: { projectId, model: "grounding-dino" },
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function segmentWithSSA(projectId: number): Promise<void> {
  await supabase
    .from("kitchen_projects")
    .update({ status: "segmenting" })
    .eq("id", projectId);

  const { data, error } = await supabase.functions.invoke("kitchen-segment", {
    body: { projectId, model: "semantic-sam" },
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function segmentWithSAM(projectId: number): Promise<void> {
  await supabase
    .from("kitchen_projects")
    .update({ status: "segmenting" })
    .eq("id", projectId);

  const { data, error } = await supabase.functions.invoke("kitchen-segment", {
    body: { projectId, model: "sam" },
  });

  if (error) throw new Error(error.message);
  return data;
}

// ─── Product Selection ───

export async function selectItem(
  projectId: number,
  categoryId: string,
  itemId: string
): Promise<void> {
  const { data: project, error: fetchError } = await supabase
    .from("kitchen_projects")
    .select("items")
    .eq("id", projectId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const items = (project.items as ProjectItem[]) || [];
  const filtered = items.filter((i) => i.category !== categoryId);
  // TODO: Look up item details from catalog
  filtered.push({
    category: categoryId,
    catalogItemId: itemId,
    productName: itemId,
    productImageUrl: "",
    price: 0,
  });

  const { error } = await supabase
    .from("kitchen_projects")
    .update({ items: filtered })
    .eq("id", projectId);

  if (error) throw new Error(error.message);
}

export async function removeItem(
  projectId: number,
  categoryId: string
): Promise<void> {
  const { data: project, error: fetchError } = await supabase
    .from("kitchen_projects")
    .select("items")
    .eq("id", projectId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const items = (project.items as ProjectItem[]) || [];
  const filtered = items.filter((i) => i.category !== categoryId);

  const { error } = await supabase
    .from("kitchen_projects")
    .update({ items: filtered })
    .eq("id", projectId);

  if (error) throw new Error(error.message);
}

// ─── AI Rendering ───

export async function renderRedesign(projectId: number): Promise<{ redesignImageUrl: string }> {
  await supabase
    .from("kitchen_projects")
    .update({ status: "rendering" })
    .eq("id", projectId);

  const { data, error } = await supabase.functions.invoke("kitchen-render", {
    body: { projectId },
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function saveRenderResult(
  projectId: number,
  redesignImageUrl: string
): Promise<void> {
  const { error } = await supabase
    .from("kitchen_projects")
    .update({ redesign_image_url: redesignImageUrl, status: "rendered" })
    .eq("id", projectId);

  if (error) throw new Error(error.message);
}

// ─── 3D Layout (via Edge Function with LLM) ───

export async function generate3DLayout(projectId: number): Promise<any> {
  const { data, error } = await supabase.functions.invoke("kitchen-3d-layout", {
    body: { projectId },
  });

  if (error) throw new Error(error.message);
  return data;
}

// ─── Proposal Generation ───

export async function generateProposal(projectId: number): Promise<any> {
  const { data, error } = await supabase.functions.invoke("kitchen-proposal", {
    body: { projectId },
  });

  if (error) throw new Error(error.message);
  return data;
}

// ─── Catalog ───

export async function getCatalogCategories(): Promise<CatalogCategory[]> {
  const { data, error } = await supabase
    .from("kitchen_catalog_categories")
    .select("*, items:kitchen_catalog_items(*)");

  if (error) throw new Error(error.message);
  return (data || []).map((cat: any) => ({
    id: cat.id,
    label: cat.label,
    icon: cat.icon || "LayoutGrid",
    color: cat.color || "#CCCCCC",
    items: (cat.items || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      brand: item.brand,
      material: item.material,
      price: item.price,
      imageUrl: item.image_url,
    })),
  }));
}

// ─── Helpers ───

function mapProject(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    original_image_url: row.original_image_url,
    redesign_image_url: row.redesign_image_url,
    segmentation_data: row.segmentation_data,
    items: row.items || [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
